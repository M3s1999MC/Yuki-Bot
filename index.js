require('./utils/loadEnv')();

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('path');
const fs = require('fs/promises');
const { Pool } = require('pg');
const QRCode = require('qrcode');
const db = require('./database/db'); 
const gachaDatabaseReady = require('./database/gacha_db');
const CommandHandler = require('./handlers/commandHandler');
const practiceSessions = require('./utils/practiceSessions');
const { getMessageContent } = require('./utils/messageContent');
const { getCanonicalMessageCountJid, getMessageSenderJid } = require('./utils/messageSender');
const { recordGroupMessages } = require('./utils/groupMessageCounter');
const { createNeonAuthState } = require('./utils/neonAuthState');

const express = require('express');
const app = express();
const port = process.env.PORT || 8000;
const dataDir = process.env.YUKI_DATA_DIR
    ? path.resolve(process.env.YUKI_DATA_DIR)
    : __dirname;

let currentQr = null;
let currentQrImage = null;
let currentSock = null; // Instancia global del socket para el código de 8 dígitos
let authStatePromise;
let reconnectTimer;
let authResetPromise;

// --- SISTEMA DE COLA Y DELAY ALEATORIO PARA PROTECCIÓN CONTRA SPAM ---
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getRandomDelay = (min = 1500, max = 3500) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

class MessageQueue {
    constructor() {
        this.queue = [];
        this.processing = false;
    }

    add(task) {
        this.queue.push(task);
        this.process();
    }

    async process() {
        if (this.processing) return;
        this.processing = true;

        try {
            while (this.queue.length > 0) {
                const task = this.queue.shift();

                try {
                    const delay = getRandomDelay(1500, 3500);
                    await sleep(delay);
                    await task();
                } catch (error) {
                    console.error("[MessageQueue Error]:", error);
                }
            }
        } finally {
            this.processing = false;
        }
    }
}

const messageQueue = new MessageQueue();

function safeReply(sock, jid, content, options = {}) {
    const formattedContent = typeof content === 'string' ? { text: content } : content;

    return new Promise((resolve, reject) => {
        messageQueue.add(async () => {
            try {
                const result = await sock.sendMessage(jid, formattedContent, options);
                resolve(result);
            } catch (err) {
                reject(err);
            }
        });
    });
}
// ---------------------------------------------------------------------

app.get('/', (req, res) => {
    res.send('Yuki Bot está activo.');
});

app.get('/health', (req, res) => {
    res.status(200).type('text/plain').send('ok');
});

// API interna para generar el código de 8 dígitos desde la web
app.get('/api/request-pairing', async (req, res) => {
    const phone = req.query.phone;
    if (!phone || phone.length < 10) {
        return res.status(400).json({ error: 'Número de teléfono inválido.' });
    }
    if (!currentSock) {
        return res.status(503).json({ error: 'El bot aún no está inicializado. Espera unos segundos.' });
    }

    try {
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const code = await currentSock.requestPairingCode(cleanPhone);
        res.json({ code });
    } catch (error) {
        console.error('Error al generar código de emparejamiento:', error);
        res.status(500).json({ error: 'No se pudo generar el código. Intenta de nuevo.' });
    }
});

// Ruta web unificada (/qr) SIN CONTRASEÑA y con pestañas (QR / Código de 8 Dígitos)
app.get('/qr', async (req, res) => {
    res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Content-Security-Policy': "default-src 'none'; img-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'",
        'Referrer-Policy': 'no-referrer',
        'X-Content-Type-Options': 'nosniff'
    });

    const qrSectionHtml = currentQrImage 
        ? `<img src="${currentQrImage}" alt="Código QR de WhatsApp">` 
        : `<p style="color:#000; padding:2rem 0; font-size:0.9rem;">Cargando QR...</p>`;

    res.type('html').send(`<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Vincular Yuki-MD | StarLight Studios</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&family=Quicksand:wght@700&display=swap" rel="stylesheet">
<style>
:root { --bg: #0f1016; --card: #181a24; --pink: #ff75a0; --purple: #c084fc; --text: #FFFDF9; --muted: #a0a5b8; --border: #2a2e3d; }
body { font-family: 'Poppins', sans-serif; background: var(--bg); color: var(--text); text-align: center; margin: 0; padding: 2rem 1rem; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; }
.card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 2rem; max-width: 420px; width: 100%; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
h1 { font-family: 'Quicksand', sans-serif; color: var(--pink); font-size: 1.6rem; margin-bottom: 0.5rem; }
p { color: var(--muted); font-size: 0.9rem; margin-bottom: 1.2rem; line-height: 1.4; }
.tabs { display: flex; gap: 10px; margin-bottom: 1.5rem; background: rgba(0,0,0,0.3); padding: 4px; border-radius: 8px; }
.tab { flex: 1; background: none; border: none; color: var(--muted); padding: 8px; font-weight: 600; cursor: pointer; border-radius: 6px; font-size: 0.85rem; transition: 0.2s; }
.tab.active { background: var(--pink); color: #000; }
.section { display: none; }
.section.active { display: block; }
.qr-container { background: #fff; padding: 12px; border-radius: 12px; display: inline-block; margin-bottom: 0.5rem; }
img { width: 100%; max-width: 240px; height: auto; display: block; border-radius: 6px; }
input { width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-size: 1rem; margin-bottom: 10px; box-sizing: border-box; text-align: center; }
input:focus { outline: none; border-color: var(--pink); }
button.btn { background: var(--pink); color: #000; border: none; padding: 12px; width: 100%; font-weight: 600; border-radius: 8px; cursor: pointer; font-size: 0.95rem; transition: 0.2s; }
button.btn:hover { opacity: 0.9; }
.code-box { background: rgba(192, 132, 252, 0.1); border: 1px dashed var(--purple); padding: 15px; border-radius: 8px; font-size: 1.8rem; font-family: monospace; color: var(--purple); letter-spacing: 3px; margin-top: 15px; font-weight: bold; word-break: break-all; }
.error { color: #ff6b6b; font-size: 0.85rem; margin-top: 8px; }
</style>
</head>
<body>
<div class="card">
    <h1>Vincular Yuki-MD 🌸</h1>
    
    <div class="tabs">
        <button class="tab active" onclick="switchTab('qr')">Código QR</button>
        <button class="tab" onclick="switchTab('code')">Código de 8 Dígitos</button>
    </div>

    <!-- Pestaña QR -->
    <div id="sec-qr" class="section active">
        <p>Abre WhatsApp > Dispositivos vinculados > Vincular dispositivo y escanea.</p>
        <div class="qr-container">
            <div id="qr-box">
                ${qrSectionHtml}
            </div>
        </div>
        <p style="font-size:0.75rem; margin-top:0.5rem;">La página se actualizará sola si el QR expira.</p>
    </div>

    <!-- Pestaña Código de 8 Dígitos -->
    <div id="sec-code" class="section">
        <p>Introduce tu número con código de país (ej: 573001234567) sin símbolos.</p>
        <input type="text" id="phoneInput" placeholder="Ej: 573001234567">
        <button class="btn" onclick="requestPairingCode()">Obtener Código</button>
        <div id="resultContainer"></div>
    </div>
</div>

<script>
    function switchTab(tab) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        
        if(tab === 'qr') {
            document.querySelectorAll('.tab')[0].classList.add('active');
            document.getElementById('sec-qr').classList.add('active');
        } else {
            document.querySelectorAll('.tab')[1].classList.add('active');
            document.getElementById('sec-code').classList.add('active');
        }
    }

    async function requestPairingCode() {
        const phone = document.getElementById('phoneInput').value.trim();
        const container = document.getElementById('resultContainer');
        
        if (!phone) {
            container.innerHTML = '<div class="error">Por favor escribe un número válido.</div>';
            return;
        }

        container.innerHTML = '<p style="margin-top:10px; color:var(--muted);">Generando código...</p>';

        try {
            const res = await fetch('/api/request-pairing?phone=' + encodeURIComponent(phone));
            const data = await res.json();

            if (res.ok && data.code) {
                container.innerHTML = '<div class="code-box">' + data.code + '</div><p style="font-size:0.75rem; margin-top:8px; color:var(--muted);">Ingrésalo en WhatsApp > Vincular con número de teléfono.</p>';
            } else {
                container.innerHTML = '<div class="error">' + (data.error || 'Ocurrió un error') + '</div>';
            }
        } catch (err) {
            container.innerHTML = '<div class="error">Error de conexión con el servidor.</div>';
        }
    }

    setTimeout(() => {
        if(document.getElementById('sec-qr').classList.contains('active')) {
            window.location.reload();
        }
    }, 5000);
</script>
</body>
</html>`);
});

app.listen(port, () => {
    console.log(`Servidor de Yuki escuchando en el puerto ${port}`);
});

// 🛡️ ESCUDO GLOBAL
process.on('uncaughtException', (err) => {
    console.error('⚠️ [Protector] Error crítico interceptado (El bot sigue en línea):', err.message);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ [Protector] Promesa rechazada no manejada:', reason);
});

const handler = new CommandHandler();
const PREFIX = '!';

async function loadAuthState() {
    if (!authStatePromise) {
        authStatePromise = (async () => {
            if (!process.env.DATABASE_URL) {
                console.warn('⚠️ DATABASE_URL no está configurada; la sesión se guardará en el disco local.');
                const sessionPath = path.join(dataDir, 'sessions', 'main');
                const authState = await useMultiFileAuthState(sessionPath);
                return {
                    ...authState,
                    resetAuthState: async () => {
                        await fs.rm(sessionPath, { recursive: true, force: true });
                    }
                };
            }

            if (!process.env.YUKI_AUTH_ENCRYPTION_KEY) {
                throw new Error('Configura YUKI_AUTH_ENCRYPTION_KEY junto con DATABASE_URL.');
            }

            let databaseUrl;
            try {
                databaseUrl = new URL(process.env.DATABASE_URL);
            } catch {
                throw new Error('DATABASE_URL no es una URL válida.');
            }

            const pool = new Pool({
                connectionString: process.env.DATABASE_URL,
                ssl: { rejectUnauthorized: true },
                max: 5,
                connectionTimeoutMillis: 10000
            });

            try {
                const authState = await createNeonAuthState(pool, process.env.YUKI_AUTH_ENCRYPTION_KEY);
                console.log('✅ Sesión de WhatsApp cargada desde PostgreSQL persistente.');
                return authState;
            } catch (error) {
                await pool.end().catch(closeError => {
                    console.error('Error cerrando la conexión de Neon:', closeError.message);
                });
                throw error;
            }
        })();
    }

    try {
        return await authStatePromise;
    } catch (error) {
        authStatePromise = null;
        throw error;
    }
}

function scheduleReconnect() {
    if (reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        startYuki().catch(error => {
            console.error('❌ No se pudo restablecer la conexión de Yuki:', error.message);
            scheduleReconnect();
        });
    }, 4000);
}

function resetLoggedOutSession() {
    if (authResetPromise) return authResetPromise;

    authResetPromise = (async () => {
        const authState = await loadAuthState();
        await authState.resetAuthState();
        if (!process.env.DATABASE_URL) {
            authStatePromise = null;
        }
        console.log('✅ Sesión revocada eliminada. Se solicitará un QR nuevo.');
        scheduleReconnect();
    })().catch(error => {
        console.error('❌ No se pudo limpiar la sesión revocada:', error.message);
        process.exit(1);
    }).finally(() => {
        authResetPromise = null;
    });

    return authResetPromise;
}

async function startYuki() {
    console.log('📂 Cargando sesión de Yuki...');
    if (db.ready) {
        await db.ready;
        console.log('✅ Datos del bot conectados a Neon.');
    }
    await gachaDatabaseReady;
    
    const { state, saveCreds } = await loadAuthState();
    const hasRegisteredSession = Boolean(state.creds.registered && state.creds.me?.id);

    if (hasRegisteredSession) {
        console.log('✅ Se encontró una sesión de WhatsApp previamente vinculada.');
    } else {
        console.log('ℹ️ No hay una sesión vinculada guardada. El primer QR debe escanearse una vez.');
    }
    
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ['YukiBot', 'Chrome', '120.0.0'],
        syncFullHistory: false
    });

    currentSock = sock; // Guardamos el socket activo globalmente para la API web
    const contactNames = new Map();

    const cacheContacts = (contacts) => {
        for (const contact of contacts || []) {
            const name = [contact.name, contact.notify, contact.verifiedName]
                .find(value => typeof value === 'string' && value.trim() && value.trim() !== 'Usuario');
            if (!name) continue;

            const ids = [contact.id, contact.lid, contact.phoneNumber]
                .filter(value => typeof value === 'string' && value.trim())
                .map(value => value.includes('@') ? value : `${value}@s.whatsapp.net`);
            for (const id of ids) contactNames.set(id, name.trim());
            db.updateContactName(contact);
        }
    };

    sock.ev.on('contacts.upsert', cacheContacts);
    sock.ev.on('contacts.update', cacheContacts);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            if (hasRegisteredSession) {
                currentQr = null;
                currentQrImage = null;
                console.warn('⚠️ WhatsApp solicita un QR aunque hay una sesión guardada.');
            } else {
                if (qr !== currentQr || !currentQrImage) {
                    currentQr = qr;
                    currentQrImage = null;
                    try {
                        const qrImage = await QRCode.toDataURL(qr, {
                            errorCorrectionLevel: 'H',
                            margin: 4,
                            width: 360
                        });
                        if (currentQr === qr) currentQrImage = qrImage;
                    } catch (error) {
                        if (currentQr === qr) currentQr = null;
                        console.error('❌ No se pudo preparar el QR:', error.message);
                    }
                }
                console.log('📱 QR o vinculación disponible en /qr.');
            }
        }

        if (connection === 'close') {
            currentQr = null;
            currentQrImage = null;
            currentSock = null; 
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            
            if (statusCode === DisconnectReason.loggedOut) {
                console.warn('⚠️ WhatsApp revocó la sesión guardada.');
                resetLoggedOutSession();
                return;
            }

            if (statusCode === DisconnectReason.connectionReplaced) {
                console.error('❌ WhatsApp reemplazó esta conexión (código 440).');
                return;
            }

            console.log(`🔄 Conexión cerrada (Código: ${statusCode}). Reconectando en 4 segundos...`);
            scheduleReconnect();
        } else if (connection === 'open') {
            if (reconnectTimer) {
                clearTimeout(reconnectTimer);
                reconnectTimer = null;
            }
            currentQr = null;
            currentQrImage = null;
            console.log(`\n⚡ ¡YUKI ESTÁ ONLINE Y CONECTADA! Prefijo activo: ${PREFIX}\n`);
        }
    });

    let credentialSaveQueue = Promise.resolve();
    sock.ev.on('creds.update', () => {
        credentialSaveQueue = credentialSaveQueue.then(async () => {
            for (let attempt = 1; attempt <= 3; attempt += 1) {
                try {
                    await saveCreds();
                    return;
                } catch (error) {
                    if (attempt === 3) throw error;
                    await new Promise(resolve => setTimeout(resolve, attempt * 1000));
                }
            }
        }).catch(error => {
            console.error('❌ No se pudieron guardar las credenciales:', error.message);
            process.exit(1);
        });
    });

    sock.ev.on('group-participants.update', async (update) => {
        if (!['add', 'remove'].includes(update.action)) return;
        db.getSafeGroup(update.id, async (err, settings) => {
            if (err) return;

            const isWelcome = update.action === 'add';
            const enabled = isWelcome ? settings.welcome_enabled : settings.goodbye_enabled;
            if (!enabled) return;

            for (const participant of update.participants || []) {
                const textTemplate = isWelcome ? settings.welcome_text : settings.goodbye_text;
                const text = (textTemplate || (isWelcome ? '¡Bienvenid@ al grupo! 🌸' : 'Hasta luego... 👋'))
                    .replace(/@user/g, `@${participant.split('@')[0]}`);
                try {
                    if (isWelcome && settings.welcome_image) {
                        await safeReply(sock, update.id, {
                            image: { url: settings.welcome_image },
                            caption: text,
                            mentions: [participant]
                        });
                    } else {
                        await safeReply(sock, update.id, { text, mentions: [participant] });
                    }
                } catch (sendErr) {
                    console.error('Error al enviar mensaje de bienvenida/despedida:', sendErr);
                }
            }
        });
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        await recordGroupMessages(db, sock, messages);
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message) return;

        const sender = getMessageSenderJid(m, sock);
        if (!sender) return;

        const initialText = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const isAfkCommand = /^!(?:afk|ausente)(?:\s|$)/i.test(initialText);
        const contactName = contactNames.get(sender)
            || contactNames.get(m.key.participantAlt)
            || contactNames.get(m.key.remoteJidAlt);
        db.recordMessageActivity(
            sender,
            contactName || m.pushName,
            {
                incrementExp: !m.key.fromMe,
                clearAfk: !m.key.fromMe && !isAfkCommand
            },
            err => { if (err) console.error('Error al registrar actividad:', err.message); }
        );

        if (!m.key.fromMe) {
            const mentionedJids = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            for (const mentionedJid of mentionedJids) {
                db.get(`SELECT afk_reason, afk_since FROM users WHERE jid = ? AND afk_since IS NOT NULL`, [mentionedJid], async (err, afkUser) => {
                    if (err || !afkUser) return;
                    const elapsed = Math.max(0, Date.now() - afkUser.afk_since);
                    const minutes = Math.floor(elapsed / 60000);
                    const away = minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h`;
                    await safeReply(sock, m.key.remoteJid, {
                        text: `「✿」 @${mentionedJid.split('@')[0]} está ausente desde hace ${away}.\nMotivo: ${afkUser.afk_reason || 'Sin motivo'} 💤`,
                        mentions: [mentionedJid]
                    }, { quoted: m });
                });
            }
        }

        const msgContent = getMessageContent(m.message);
        const messageType = Object.keys(msgContent)[0];
        const body = messageType === 'conversation' ? msgContent.conversation :
                     messageType === 'extendedTextMessage' ? msgContent.extendedTextMessage.text : 
                     messageType === 'imageMessage' ? msgContent.imageMessage.caption :
                     messageType === 'videoMessage' ? msgContent.videoMessage.caption : '';

        if (!body || typeof body !== 'string') return;

        if (m.key.remoteJid.endsWith('@g.us') && /(?:chat\.whatsapp\.com\/|whatsapp\.com\/channel\/)/i.test(body)) {
            db.getSafeGroup(m.key.remoteJid, async (settingsErr, settings) => {
                if (settingsErr || !settings.antilink) return;

                try {
                    const metadata = await sock.groupMetadata(m.key.remoteJid);
                    const participant = metadata.participants.find(item =>
                        [item.id, item.jid, item.lid, item.phoneNumber].filter(Boolean).includes(sender)
                    );
                    if (participant?.admin) return;
                    await sock.sendMessage(m.key.remoteJid, { delete: m.key });
                    await safeReply(sock, m.key.remoteJid, {
                        text: `「✿」 @${sender.split('@')[0]}, eliminé el enlace de invitación publicado. 🌸`,
                        mentions: [sender]
                    }, { quoted: m });
                } catch (antilinkErr) {
                    console.error('Error al moderar enlace:', antilinkErr);
                }
            });
        }

        if (!m.key.fromMe && !m.key.remoteJid.endsWith('@g.us') && !body.startsWith(PREFIX) && practiceSessions.sessions.has(sender)) {
            const replyText = practiceSessions.respond(body, practiceSessions.sessions.get(sender));
            await safeReply(sock, m.key.remoteJid, { text: `「✿」 ${replyText}` }, { quoted: m });
            return;
        }

        if (!body.startsWith(PREFIX)) return;
        const usedPrefix = PREFIX;

        const args = body.slice(usedPrefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        console.log(`📥 [Comando recibido]: ${command} de @${sender.split('@')[0]}`);

        try {
            const ctx = {
                sock,
                m,
                msg: m,
                body,
                usedPrefix,
                command,
                args,
                sender,
                reply: (content, options) => safeReply(sock, m.key.remoteJid, content, { quoted: m, ...options })
            };

            await handler.handle(sock, m, body, usedPrefix, command, args, ctx);
        } catch (err) {
            console.error(`❌ Error ejecutando el comando '${command}':`, err);
            await safeReply(sock, m.key.remoteJid, { text: '❌ Ocurrió un error interno al procesar este comando.' }, { quoted: m });
        }
    });
}

startYuki().catch(error => {
    console.error('❌ No se pudo iniciar Yuki:', error);
    process.exit(1);
});
