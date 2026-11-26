require('./utils/loadEnv')();

const pino = require('pino');
const path = require('path');
const fs = require('fs/promises');
const { Pool } = require('pg');
const { timingSafeEqual } = require('crypto');
const QRCode = require('qrcode');
const db = require('./database/db');
const gachaDatabaseReady = require('./database/gacha_db');
const CommandHandler = require('./handlers/commandHandler');
const { handleConversationalAI } = require('./handlers/aiChat');
const practiceSessions = require('./utils/practiceSessions');
const { getMessageContent } = require('./utils/messageContent');
const { getCanonicalMessageCountJid, getMessageSenderJid } = require('./utils/messageSender');
const { recordGroupMessages } = require('./utils/groupMessageCounter');
const { createNeonAuthState } = require('./utils/neonAuthState');
const { pick, frases } = require('./utils/personality');

const express = require('express');
const app = express();
const port = process.env.PORT || 8000;
const dataDir = process.env.YUKI_DATA_DIR
    ? path.resolve(process.env.YUKI_DATA_DIR)
    : __dirname;

let currentQr = null;
let currentQrImage = null;
let activeSock = null;
let lastPairingCode = null;
let lastPairingPhone = null;
let authStatePromise;
let reconnectTimer;
let authResetPromise;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const getRandomDelay = (min = 1500, max = 3500) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
const MAX_QUEUE_SIZE = 15;

class MessageQueue {
    constructor() {
        this.queue = [];
        this.processing = false;
    }
    add(task) {
        if (this.queue.length >= MAX_QUEUE_SIZE) return false;
        this.queue.push(task);
        this.process();
        return true;
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
                    console.error('[MessageQueue Error]:', error);
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
        const accepted = messageQueue.add(async () => {
            try {
                const result = await sock.sendMessage(jid, formattedContent, options);
                resolve(result);
            } catch (err) {
                reject(err);
            }
        });
        if (!accepted) {
            console.warn('⚠️ Cola de envío llena; se descartó una respuesta.');
            resolve(null);
        }
    });
}

function verifyQrBasicAuth(req, res) {
    const accessToken = process.env.QR_ACCESS_TOKEN;
    if (!accessToken || accessToken.length < 32) {
        res.status(503).send('Configura QR_ACCESS_TOKEN con al menos 32 caracteres en el entorno del servidor.');
        return false;
    }
    const authorization = req.get('authorization') || '';
    const credentialsMatch = authorization.match(/^Basic\s+([A-Za-z0-9+/]+={0,2})$/i);
    const credentials = credentialsMatch
        ? Buffer.from(credentialsMatch[1], 'base64').toString('utf8')
        : '';
    const separator = credentials.indexOf(':');
    const password = Buffer.from(separator === -1 ? '' : credentials.slice(separator + 1));
    const expectedPassword = Buffer.from(accessToken);
    if (
        separator === -1
        || credentials.slice(0, separator) !== 'yuki'
        || password.length !== expectedPassword.length
        || !timingSafeEqual(password, expectedPassword)
    ) {
        res.set('WWW-Authenticate', 'Basic realm="YukiBot QR", charset="UTF-8"');
        res.sendStatus(401);
        return false;
    }
    return true;
}

app.get('/', (req, res) => {
    res.send('Yuki Bot está activo.');
});

app.get('/health', (req, res) => {
    res.status(200).type('text/plain').send('ok');
});

app.post('/qr/pair', async (req, res) => {
    if (!verifyQrBasicAuth(req, res)) return;

    if (!activeSock || typeof activeSock.requestPairingCode !== 'function') {
        return res.status(503).json({
            error: 'El socket de WhatsApp aún no está listo. Espera unos segundos y vuelve a intentarlo.'
        });
    }

    const rawPhone = String(req.body?.phone || '');
    const cleanPhone = rawPhone.replace(/\D/g, '');
    if (cleanPhone.length < 8 || cleanPhone.length > 15) {
        return res.status(400).json({
            error: 'Ingresa el número completo con código de país, solo dígitos (ejemplo: 573001234567).'
        });
    }

    try {
        const code = await activeSock.requestPairingCode(cleanPhone);
        lastPairingCode = code;
        lastPairingPhone = cleanPhone;
        return res.json({ code, phone: cleanPhone });
    } catch (error) {
        console.error('❌ Error al generar el código de 8 caracteres:', error);
        return res.status(500).json({
            error: error?.message || 'No se pudo generar el código de vinculación.'
        });
    }
});

app.get('/qr', async (req, res) => {
    if (!verifyQrBasicAuth(req, res)) return;

    res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Content-Security-Policy': "default-src 'none'; img-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'",
        'Referrer-Policy': 'no-referrer',
        'X-Content-Type-Options': 'nosniff'
    });

    const qrSectionHtml = currentQrImage
        ? `
            <p>Con el teléfono del número de Yuki, abre <strong>WhatsApp &gt; Dispositivos vinculados &gt; Vincular un dispositivo</strong> y escanea este código.</p>
            <img src="${currentQrImage}" alt="Código QR para vincular el número de Yuki con WhatsApp">
            <p class="note">Este QR vincula el número de Yuki al bot; no es un QR de contacto ni debe escanearse desde otros números.</p>
            <p class="note">WhatsApp puede hacer caducar el código. Si ocurre, recarga esta página para consultar el nuevo código solicitado por WhatsApp.</p>
        `
        : `
            <p class="note">No hay un código QR activo en este momento. Puedes intentar vincular usando un <strong>código de 8 caracteres</strong> aquí abajo o revisar los logs del servidor.</p>
        `;

    const initialCodeHtml = lastPairingCode
        ? `<div id="pairResult" class="code-box">Código (${lastPairingPhone || ''}): <strong>${lastPairingCode}</strong></div>`
        : `<div id="pairResult" class="code-box" style="display:none;"></div>`;

    res.type('html').send(`<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Vincular el número de Yuki</title>
<style>
body{font-family:system-ui,sans-serif;text-align:center;margin:2rem auto;padding:0 1rem;max-width:30rem;line-height:1.45}
img{width:min(100%,360px);height:auto;border-radius:8px}
.note{color:#555;font-size:0.92rem}
.box{margin-top:2rem;padding-top:1.5rem;border-top:1px solid #ddd}
.row{display:flex;gap:0.5rem;justify-content:center;flex-wrap:wrap;margin-top:0.75rem}
input{padding:0.6rem 0.75rem;border:1px solid #aaa;border-radius:6px;font-size:1rem;min-width:13rem}
button{padding:0.6rem 1rem;border:0;border-radius:6px;background:#111827;color:#fff;font-size:1rem;cursor:pointer}
button:disabled{opacity:0.6;cursor:not-allowed}
.code-box{margin-top:1rem;padding:0.9rem;border-radius:8px;background:#f3f4f6;font-size:1.25rem;letter-spacing:0.12em}
.err{color:#b91c1c;margin-top:0.75rem;font-size:0.95rem}
</style>
</head>
<body>
<h1>Vincular el número de Yuki</h1>
${qrSectionHtml}

<div class="box">
<h2>Vincular con código de 8 caracteres</h2>
<p class="note">Escribe el número completo con código de país (sin + ni espacios). Luego ve a WhatsApp &gt; Dispositivos vinculados &gt; Vincular con el número de teléfono.</p>
<form id="pairForm" class="row">
<input id="phoneInput" name="phone" type="tel" inputmode="numeric" placeholder="Ej. 573001234567" required>
<button id="pairBtn" type="submit">Generar código</button>
</form>
<div id="pairError" class="err"></div>
${initialCodeHtml}
</div>

<script>
const form = document.getElementById('pairForm');
const phoneInput = document.getElementById('phoneInput');
const pairBtn = document.getElementById('pairBtn');
const pairError = document.getElementById('pairError');
const pairResult = document.getElementById('pairResult');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  pairError.textContent = '';
  pairBtn.disabled = true;
  pairBtn.textContent = 'Generando...';

  try {
    const response = await fetch('/qr/pair', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phoneInput.value })
    });
    const data = await response.json();
    if (!response.ok) {
      pairError.textContent = data.error || 'No se pudo generar el código.';
    } else {
      pairResult.style.display = 'block';
      pairResult.innerHTML = 'Código (' + data.phone + '): <strong>' + data.code + '</strong>';
    }
  } catch (err) {
    pairError.textContent = 'Error de red al solicitar el código.';
  } finally {
    pairBtn.disabled = false;
    pairBtn.textContent = 'Generar código';
  }
});
</script>
</body>
</html>`);
});

app.listen(port, () => {
    console.log(`Servidor de Yuki escuchando en el puerto ${port}`);
});

const SELF_URL = process.env.RENDER_EXTERNAL_URL || process.env.SELF_URL || process.env.PUBLIC_URL || '';
async function doSelfPing() {
    if (!SELF_URL) return;
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const res = await fetch(SELF_URL.replace(/\/$/, '') + '/health', { signal: controller.signal });
        clearTimeout(timeout);
        console.log(`[Pinger] Yuki sigue viva. Status: ${res.status}`);
    } catch (e) {
        console.log('[Pinger] Falló el ping: ' + (e.message || e));
    }
}
setInterval(doSelfPing, 5 * 60 * 1000);
setTimeout(doSelfPing, 10000);

process.on('uncaughtException', (err) => {
    console.error('⚠️ [Protector] Error crítico interceptado (El bot sigue en línea):', err.message);
});
process.on('unhandledRejection', (reason) => {
    console.error('⚠️ [Protector] Promesa rechazada no manejada:', reason);
});

const handler = new CommandHandler();
const PREFIX = '!';

const cooldowns = new Map();
const randomCooldown = (min = 4000, max = 8000) =>
    Math.floor(Math.random() * (max - min + 1)) + min;
function onCooldown(sender) {
    const now = Date.now();
    if (now < (cooldowns.get(sender) || 0)) return true;
    cooldowns.set(sender, now + randomCooldown());
    return false;
}
setInterval(() => {
    const now = Date.now();
    for (const [jid, until] of cooldowns) {
        if (now > until) cooldowns.delete(jid);
    }
}, 60 * 1000);

const afkNotified = new Map();
const AFK_NOTICE_INTERVAL_MS = 10 * 60 * 1000;

async function loadAuthState() {
    if (!authStatePromise) {
        authStatePromise = (async () => {
            if (!process.env.DATABASE_URL) {
                console.warn('⚠️ DATABASE_URL no está configurada; la sesión se guardará en el disco local y puede perderse al reiniciar el servidor.');
                const { useMultiFileAuthState } = await import('@whiskeysockets/baileys');
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
                throw new Error('Configura YUKI_AUTH_ENCRYPTION_KEY junto con DATABASE_URL para proteger la sesión de WhatsApp.');
            }
            let databaseUrl;
            try {
                databaseUrl = new URL(process.env.DATABASE_URL);
            } catch {
                throw new Error('DATABASE_URL no es una URL válida. Configura la URL PostgreSQL completa de Neon sin comillas ni el prefijo DATABASE_URL=.');
            }
            if (!['postgres:', 'postgresql:'].includes(databaseUrl.protocol)) {
                throw new Error('DATABASE_URL debe ser una URL PostgreSQL completa de Neon.');
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
                    console.error('Error cerrando la conexión de Neon tras fallar la carga de sesión:', closeError.message);
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
    const { default: makeWASocket, DisconnectReason } = await import('@whiskeysockets/baileys');
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
    activeSock = sock;

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
                console.warn('⚠️ WhatsApp solicita un QR aunque hay una sesión guardada. Comprueba que DATABASE_URL y YUKI_AUTH_ENCRYPTION_KEY no hayan cambiado y que solo haya una instancia del bot.');
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
                        console.error('❌ No se pudo preparar el QR de vinculación de WhatsApp:', error.message);
                    }
                }
                console.log('📱 QR para vincular el número de Yuki disponible en /qr. Configura QR_ACCESS_TOKEN para abrirlo.');
            }
        }
        if (connection === 'close') {
            currentQr = null;
            currentQrImage = null;
            activeSock = null;
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            if (statusCode === DisconnectReason.loggedOut) {
                console.warn('⚠️ WhatsApp revocó la sesión guardada. Limpiando solo la autenticación para solicitar un QR nuevo...');
                resetLoggedOutSession();
                return;
            }
            if (statusCode === DisconnectReason.connectionReplaced) {
                console.error('❌ WhatsApp reemplazó esta conexión (código 440). Detén cualquier otra instancia de Yuki que use esta misma sesión y reinicia este servicio. Se pausó la reconexión automática para evitar un bucle.');
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
            lastPairingCode = null;
            lastPairingPhone = null;
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
            console.error('❌ No se pudieron guardar las credenciales de WhatsApp tras 3 intentos:', error.message);
            process.exit(1);
        });
    });
    sock.ev.on('group-participants.update', async (update) => {
        if (!['add', 'remove'].includes(update.action)) return;
        db.getSafeGroup(update.id, async (err, settings) => {
            if (err) {
                console.error('Error al leer la configuración de bienvenida:', err.message);
                return;
            }
            const isWelcome = update.action === 'add';
            const enabled = isWelcome ? settings.welcome_enabled : settings.goodbye_enabled;
            if (!enabled) return;
            for (const participant of update.participants || []) {
                const textTemplate = isWelcome ? settings.welcome_text : settings.goodbye_text;
                const text = (textTemplate || pick(isWelcome ? frases.bienvenida : frases.despedida))
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
        await recordGroupMessages(db, sock, messages).catch(e => console.error('Error recordGroupMessages:', e.message));
        const m = messages[0];
        if (!m.message) return;
        const sender = getMessageSenderJid(m, sock);
        if (!sender) {
            console.error('❌ No se pudo identificar al remitente; se omite el mensaje para proteger las cuentas.');
            return;
        }

        function buscarBoton(obj) {
            if (!obj || typeof obj !== 'object') return '';
            if (obj.selectedButtonId) return obj.selectedButtonId;
            if (obj.selectedId) return obj.selectedId;
            if (obj.interactiveResponseMessage?.body?.text) return obj.interactiveResponseMessage.body.text;
            if (obj.body?.text && (obj.body.text === '!audio' || obj.body.text === '!video')) return obj.body.text;
            for (const v of Object.values(obj)) {
                const r = buscarBoton(v);
                if (r) return r;
            }
            return '';
        }
        const buttonId = buscarBoton(m.message);

        const initialText = buttonId || m.message?.conversation || m.message?.extendedTextMessage?.text || '';
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
            err => {
                if (err) console.error('Error al registrar la actividad del usuario:', err.message);
            }
        );
        if (!m.key.fromMe) {
            const mentionedJids = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            for (const mentionedJid of mentionedJids) {
                const afkKey = `${m.key.remoteJid}:${mentionedJid}`;
                if (Date.now() - (afkNotified.get(afkKey) || 0) < AFK_NOTICE_INTERVAL_MS) continue;
                db.get(`SELECT afk_reason, afk_since FROM users WHERE jid = ? AND afk_since IS NOT NULL`, [mentionedJid], async (err, afkUser) => {
                    if (err) {
                        console.error('Error al consultar estado AFK:', err.message);
                        return;
                    }
                    if (!afkUser) return;
                    afkNotified.set(afkKey, Date.now());
                    const elapsed = Math.max(0, Date.now() - afkUser.afk_since);
                    const minutes = Math.floor(elapsed / 60000);
                    const away = minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h`;
                    await safeReply(sock, m.key.remoteJid, {
                        text: frases.afk(mentionedJid, away, afkUser.afk_reason),
                        mentions: [mentionedJid]
                    }, { quoted: m });
                });
            }
        }
        const msgContent = getMessageContent(m.message);
        const messageType = Object.keys(msgContent)[0];
        let body = messageType === 'conversation' ? msgContent.conversation :
                     messageType === 'extendedTextMessage' ? msgContent.extendedTextMessage.text :
                     messageType === 'imageMessage' ? msgContent.imageMessage.caption :
                     messageType === 'videoMessage' ? msgContent.videoMessage.caption : '';
        if (buttonId) {
            body = buttonId;
        }
        if (!body || typeof body !== 'string') return;
        if (m.key.remoteJid.endsWith('@g.us') && /(?:chat\.whatsapp\.com\/|whatsapp\.com\/channel\/)/i.test(body)) {
            db.getSafeGroup(m.key.remoteJid, async (settingsErr, settings) => {
                if (settingsErr) {
                    console.error('Error al consultar protección antilink:', settingsErr.message);
                    return;
                }
                if (!settings.antilink) return;
                try {
                    const metadata = await sock.groupMetadata(m.key.remoteJid);
                    const participant = metadata.participants.find(item =>
                        [item.id, item.jid, item.lid, item.phoneNumber].filter(Boolean).includes(sender)
                    );
                    if (participant?.admin) return;
                    await sock.sendMessage(m.key.remoteJid, { delete: m.key });
                    await safeReply(sock, m.key.remoteJid, {
                        text: frases.linkEliminado(sender),
                        mentions: [sender]
                    }, { quoted: m });
                } catch (antilinkErr) {
                    console.error('Error al moderar enlace del grupo:', antilinkErr);
                    await safeReply(sock, m.key.remoteJid, { text: pick(frases.noPudeModerar) }, { quoted: m });
                }
            });
        }
        if (!m.key.fromMe && !m.key.remoteJid.endsWith('@g.us') && !body.startsWith(PREFIX) && practiceSessions.sessions.has(sender)) {
            const replyText = practiceSessions.respond(body, practiceSessions.sessions.get(sender));
            await safeReply(sock, m.key.remoteJid, { text: `「✿」 ${replyText}` }, { quoted: m });
            return;
        }
        if (!body.startsWith(PREFIX)) {
            await handleConversationalAI(sock, m, body, safeReply);
            return;
        }
        const usedPrefix = PREFIX;
        const args = body.slice(usedPrefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (!m.key.fromMe && onCooldown(sender)) return;

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
            await safeReply(sock, m.key.remoteJid, { text: pick(frases.errorInterno) }, { quoted: m });
        }
    });
}

startYuki().catch(error => {
    console.error('❌ No se pudo iniciar Yuki:', error);
    process.exit(1);
});
