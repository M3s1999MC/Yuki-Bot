require('./utils/loadEnv')();

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('path');
const qrcode = require('qrcode-terminal');
const db = require('./database/db'); 
require('./database/gacha_db');
const CommandHandler = require('./handlers/commandHandler');
const practiceSessions = require('./utils/practiceSessions');
const { getMessageContent } = require('./utils/messageContent');

const express = require('express');
const app = express();
const port = process.env.PORT || 8000;
const dataDir = process.env.YUKI_DATA_DIR
    ? path.resolve(process.env.YUKI_DATA_DIR)
    : __dirname;

app.get('/', (req, res) => {
    res.send('Yuki Bot está activo y corriendo 24/7');
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

async function startYuki() {
    const sessionPath = path.join(dataDir, 'sessions', 'main');
    console.log('📂 Cargando sesión de Yuki...');
    
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ['YukiBot', 'Chrome', '120.0.0']
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
            console.log('\n========================================');
            console.log('📱 ¡ ESCANEA ESTE CÓDIGO QR CON WHATSAPP !');
            console.log('========================================\n');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            console.log(`🔄 Conexión cerrada (Código: ${statusCode}). Reconectando en 4 segundos...`);
            
            if (statusCode !== DisconnectReason.loggedOut) {
                setTimeout(() => startYuki(), 4000);
            } else {
                console.log('❌ Sesión cerrada. Borra la carpeta "sessions/main" y vuelve a iniciar.');
            }
        } else if (connection === 'open') {
            console.log(`\n⚡ ¡YUKI ESTÁ ONLINE Y CONECTADA! Prefijo activo: ${PREFIX}\n`);
        }
    });

    sock.ev.on('creds.update', saveCreds);

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

startYuki();