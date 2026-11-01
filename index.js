require('./utils/loadEnv')();

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('path');
const fs = require('fs/promises');
const { Pool } = require('pg');
const { timingSafeEqual } = require('crypto');
const QRCode = require('qrcode');
const db = require('./database/db'); 
require('./database/gacha_db');
const CommandHandler = require('./handlers/commandHandler');
const practiceSessions = require('./utils/practiceSessions');
const { getMessageContent } = require('./utils/messageContent');
const { createNeonAuthState } = require('./utils/neonAuthState');

const express = require('express');
const app = express();
const port = process.env.PORT || 8000;
const dataDir = process.env.YUKI_DATA_DIR
    ? path.resolve(process.env.YUKI_DATA_DIR)
    : __dirname;
let currentQr = null;
let authStatePromise;
let reconnectTimer;
let authResetPromise;

app.get('/', (req, res) => {
    res.send('Yuki Bot está activo.');
});

app.get('/qr', async (req, res) => {
    const accessToken = process.env.QR_ACCESS_TOKEN;
    if (!accessToken || accessToken.length < 32) {
        return res.status(503).send('Configura QR_ACCESS_TOKEN con al menos 32 caracteres en el entorno de Render.');
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
        return res.sendStatus(401);
    }

    res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Content-Security-Policy': "default-src 'none'; img-src data:; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
        'Referrer-Policy': 'no-referrer',
        'X-Content-Type-Options': 'nosniff'
    });

    if (!currentQr) {
        return res.status(503).send('WhatsApp no está solicitando un QR. Revisa los logs de conexión de Render.');
    }

    const qrImage = await QRCode.toDataURL(currentQr, {
        errorCorrectionLevel: 'H',
        margin: 4,
        width: 360
    });
    res.type('html').send(`<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="refresh" content="20">
<title>Vincular YukiBot</title>
<style>
body{font-family:system-ui,sans-serif;text-align:center;margin:2rem auto;padding:0 1rem;max-width:28rem}
img{width:min(100%,360px);height:auto}
</style>
</head>
<body>
<h1>Vincular YukiBot</h1>
<p>En WhatsApp abre Dispositivos vinculados y escanea este código.</p>
<img src="${qrImage}" alt="Código QR de vinculación de WhatsApp">
<p>La página se actualiza automáticamente.</p>
</body>
</html>`);
});

app.listen(port, () => {
    console.log(`Servidor de Yuki escuchando en el puerto ${port}`);
});

// 🛡️ ESCUDO GLOBAL: Evita que cualquier error imprevisto (como SQLite) apague el bot
process.on('uncaughtException', (err) => {
    console.error('⚠️ [Protector] Error crítico interceptado (El bot sigue en línea):', err.message);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ [Protector] Promesa rechazada no manejada:', reason);
});

const handler = new CommandHandler();

// Único prefijo permitido
const PREFIX = '!';

async function loadAuthState() {
    if (!authStatePromise) {
        authStatePromise = (async () => {
            if (!process.env.DATABASE_URL) {
                console.warn('⚠️ DATABASE_URL no está configurada; la sesión se guardará en el disco local y puede perderse al reiniciar Render.');
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

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            currentQr = qr;
            if (hasRegisteredSession) {
                console.warn('⚠️ WhatsApp solicita un QR aunque hay una sesión guardada. Comprueba que DATABASE_URL y YUKI_AUTH_ENCRYPTION_KEY no hayan cambiado y que solo haya una instancia del bot.');
            } else {
                console.log('📱 QR inicial disponible en /qr. Configura QR_ACCESS_TOKEN para abrirlo.');
            }
        }

        if (connection === 'close') {
            currentQr = null;
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            
            if (statusCode === DisconnectReason.loggedOut) {
                console.warn('⚠️ WhatsApp revocó la sesión guardada. Limpiando solo la autenticación para solicitar un QR nuevo...');
                resetLoggedOutSession();
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
                const text = (textTemplate || (isWelcome ? '¡Bienvenid@ al grupo! 🌸' : 'Hasta luego... 👋'))
                    .replace(/@user/g, `@${participant.split('@')[0]}`);
                try {
                    if (isWelcome && settings.welcome_image) {
                        await sock.sendMessage(update.id, {
                            image: { url: settings.welcome_image },
                            caption: text,
                            mentions: [participant]
                        });
                    } else {
                        await sock.sendMessage(update.id, { text, mentions: [participant] });
                    }
                } catch (sendErr) {
                    console.error('Error al enviar mensaje de bienvenida/despedida:', sendErr);
                }
            }
        });
    });

    // ESCUCHADOR DE MENSAJES SEGURO
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message) return;

        // 🟢 IDENTIFICAR AL REMITENTE
        const sender = m.key.participant || m.key.remoteJid;

        // 🟢 REGISTRO AUTOMÁTICO UNIVERSAL
        if (sender) {
            const contactName = contactNames.get(sender)
                || contactNames.get(m.key.participantAlt)
                || contactNames.get(m.key.remoteJidAlt);
            db.registerUser(sender, contactName || m.pushName);
        }
        const initialText = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const isAfkCommand = /^!(?:afk|ausente)(?:\s|$)/i.test(initialText);
        if (!m.key.fromMe && sender) {
            if (!isAfkCommand) {
            db.run(`UPDATE users SET afk_reason = NULL, afk_since = NULL WHERE jid = ? AND afk_since IS NOT NULL`, [sender], (err) => {
                if (err) console.error('Error al desactivar estado AFK:', err.message);
            });
            }
            const mentionedJids = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            for (const mentionedJid of mentionedJids) {
                db.get(`SELECT afk_reason, afk_since FROM users WHERE jid = ? AND afk_since IS NOT NULL`, [mentionedJid], async (err, afkUser) => {
                    if (err) {
                        console.error('Error al consultar estado AFK:', err.message);
                        return;
                    }
                    if (!afkUser) return;
                    const elapsed = Math.max(0, Date.now() - afkUser.afk_since);
                    const minutes = Math.floor(elapsed / 60000);
                    const away = minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h`;
                    await sock.sendMessage(m.key.remoteJid, {
                        text: `「✿」 @${mentionedJid.split('@')[0]} está ausente desde hace ${away}.\nMotivo: ${afkUser.afk_reason || 'Sin motivo especificado'} 💤`,
                        mentions: [mentionedJid]
                    }, { quoted: m });
                });
            }
        }
        if (!m.key.fromMe && sender) {
            db.run(
                `UPDATE users SET exp = exp + 1, level = CAST((exp + 1) / 500 AS INTEGER) + 1 WHERE jid = ?`,
                [sender],
                (err) => {
                    if (err) console.error('Error al actualizar experiencia:', err.message);
                }
            );
        }
        if (!m.key.fromMe && m.key.remoteJid.endsWith('@g.us') && sender) {
            db.run(
                `INSERT INTO message_counts (group_jid, user_jid, count, last_message_at) VALUES (?, ?, 1, ?)
                 ON CONFLICT(group_jid, user_jid) DO UPDATE SET count = count + 1, last_message_at = excluded.last_message_at`,
                [m.key.remoteJid, sender, Date.now()],
                (err) => {
                    if (err) console.error('Error al actualizar el conteo del grupo:', err.message);
                }
            );
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
                    await sock.sendMessage(m.key.remoteJid, {
                        text: `「✿」 @${sender.split('@')[0]}, eliminé el enlace de invitación publicado. 🌸`,
                        mentions: [sender]
                    }, { quoted: m });
                } catch (antilinkErr) {
                    console.error('Error al moderar enlace del grupo:', antilinkErr);
                    await sock.sendMessage(m.key.remoteJid, { text: '「✿」 No pude moderar el enlace; revisa los permisos del bot.' }, { quoted: m });
                }
            });
        }

        if (!m.key.fromMe && !m.key.remoteJid.endsWith('@g.us') && !body.startsWith(PREFIX) && practiceSessions.sessions.has(sender)) {
            const reply = practiceSessions.respond(body, practiceSessions.sessions.get(sender));
            await sock.sendMessage(m.key.remoteJid, { text: `「✿」 ${reply}` }, { quoted: m });
            return;
        }

        if (!body.startsWith(PREFIX)) return;
        const usedPrefix = PREFIX;

        const args = body.slice(usedPrefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        console.log(`📥 [Comando recibido]: ${command} de @${sender.split('@')[0]}`);

        // Ejecución segura del comando
        try {
            await handler.handle(sock, m, body, usedPrefix, command, args);
        } catch (err) {
            console.error(`❌ Error ejecutando el comando '${command}':`, err);
            await sock.sendMessage(m.key.remoteJid, { text: '❌ Ocurrió un error interno al procesar este comando.' }, { quoted: m });
        }
    });
}

startYuki().catch(error => {
    console.error('❌ No se pudo iniciar Yuki:', error);
    process.exit(1);
});
