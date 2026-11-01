const { makeWASocket, useMultiFileAuthState, DisconnectReason, PHONENUMBER_MCC } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const dataDir = process.env.YUKI_DATA_DIR
    ? path.resolve(process.env.YUKI_DATA_DIR)
    : path.resolve(__dirname, '../..');

// Almacén global para las sesiones activas de sub-bots
global.subBots = global.subBots || {};

module.exports = {
    name: 'serbot',
    aliases: ['jadibot', 'subbot', 'code'],
    category: 'subbot',
    description: 'Sistema de vinculación y gestión de sub-bots en Yuki.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;
        const body = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const commandUsed = body.slice(1).trim().split(/ +/)[0].toLowerCase();

        // 1. Listar bots activos (!subbots / !bots / !sockets)
        if (['subbots', 'listarbots', 'listbots', 'bots', 'sockets'].includes(commandUsed)) {
            const activeKeys = Object.keys(global.subBots);
            let text = `🤖 *SUB-BOTS ACTIVOS* 🤖\n\nTotal en ejecución: *${activeKeys.length}*\n`;
            activeKeys.forEach((key, idx) => {
                text += `\n${idx + 1}. Sub-Bot ID: \`${key.split('@')[0]}\``;
            });
            return await sock.sendMessage(jid, { text }, { quoted: m });
        }

        // 2. Estado del propio sub-bot (!misubbot)
        if (['misubbot', 'mivinculo', 'mibot'].includes(commandUsed)) {
            const isSubActive = global.subBots[sender];
            if (!isSubActive) {
                return await sock.sendMessage(jid, { text: '❌ No tienes ningún sub-bot vinculado actualmente. Usa `!serbot` para iniciar.' }, { quoted: m });
            }
            return await sock.sendMessage(jid, { text: '🟢 Tu sub-bot se encuentra actualmente *conectado y activo*.' }, { quoted: m });
        }

        // 3. Desvincular sub-bot (!desvincular / !unlink / !delsub)
        if (['desvincular', 'unlink', 'delsub'].includes(commandUsed)) {
            if (global.subBots[sender]) {
                try {
                    global.subBots[sender].end(undefined);
                    delete global.subBots[sender];
                    const sessionPath = path.join(dataDir, `sessions_${sender.split('@')[0]}`);
                    if (fs.existsSync(sessionPath)) {
                        fs.rmSync(sessionPath, { recursive: true, force: true });
                    }
                    await sock.sendMessage(jid, { text: '🗑️ Sub-bot desvinculado y sesión eliminada correctamente.' }, { quoted: m });
                } catch (err) {
                    await sock.sendMessage(jid, { text: '❌ Error al cerrar la sesión del sub-bot.' }, { quoted: m });
                }
            } else {
                await sock.sendMessage(jid, { text: '❌ No tienes un sub-bot activo para desvincular.' }, { quoted: m });
            }
            return;
        }

        // 4. Vincular Sub-Bot (!serbot / !jadibot / !code)
        if (['serbot', 'jadibot', 'subbot', 'code'].includes(commandUsed)) {
            const phoneNumber = args[0] ? args[0].replace(/[^0-9]/g, '') : '';
            if (!phoneNumber || phoneNumber.length < 10) {
                return await sock.sendMessage(jid, { 
                    text: '⚠️ Por favor, ingresa tu número de teléfono con código de país para generar el código de emparejamiento.\n_Ejemplo:_ `!serbot 573001234567`' 
                }, { quoted: m });
            }

            await sock.sendMessage(jid, { text: '⏳ Generando código de emparejamiento para tu sub-bot, espera un momento...' }, { quoted: m });

            const sessionDir = path.join(dataDir, `sessions_${sender.split('@')[0]}`);
            const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

            const subSock = makeWASocket({
                auth: state,
                printQRInTerminal: false,
                logger: require('pino')({ level: 'silent' })
            });

            global.subBots[sender] = subSock;

            if (!subSock.authState.creds.registered) {
                setTimeout(async () => {
                    try {
                        let code = await subSock.requestPairingCode(phoneNumber);
                        code = code?.match(/.{1,4}/g)?.join('-') || code;
                        await sock.sendMessage(jid, { text: `🔑 *CÓDIGO DE EMPAREJAMIENTO DE SUB-BOT*\n\nTu código es: *${code}*\n\n_Ingrésalo en tu WhatsApp (Dispositivos vinculados > Vincular con número de teléfono)._` }, { quoted: m });
                    } catch (err) {
                        console.error('Error generando pairing code:', err);
                        await sock.sendMessage(jid, { text: '❌ No se pudo generar el código de emparejamiento. Verifica tu número.' }, { quoted: m });
                    }
                }, 3000);
            }

            subSock.ev.on('creds.update', saveCreds);
            subSock.ev.on('connection.update', (update) => {
                const { connection } = update;
                if (connection === 'open') {
                    console.log(`✅ Sub-bot conectado exitosamente para: ${sender}`);
                }
            });
        }
    }
};