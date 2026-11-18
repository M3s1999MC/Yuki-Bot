const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'duelo',
    aliases: ['fight', 'desafio'],
    category: 'economy',
    description: 'Desafía a un usuario apostando Bolívares en un duelo a muerte.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        
        // Obtener al usuario mencionado
        const targetUser = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                           (m.message.imageMessage?.contextInfo?.mentionedJid?.[0]);

        // Extraer el monto (último argumento o el que sea número válido)
        const argMonto = args.find(arg => /^\d+$/.test(arg));
        const monto = parseInt(argMonto);

        if (!targetUser || isNaN(monto) || monto <= 0) {
            return await sock.sendMessage(jid, { 
                text: `「✿」 DUELO DE APUESTAS ⚔️\n\n` +
                      `₊˚ˑ༄ Menciona a tu rival y define el monto a apostar.\n` +
                      `❀ *Uso:* \`!duelo @usuario <cantidad>\`\n` +
                      `❀ *Ejemplo:* \`!duelo @usuario 1000\` 🌸` 
            }, { quoted: m });
        }

        if (targetUser === sender) {
            return await sock.sendMessage(jid, { 
                text: `「✿」 DUELO INVÁLIDO 🥀\n\n₊˚ˑ༄ No puedes hacerte un duelo a ti mismo, tonto.` 
            }, { quoted: m });
        }

        db.getSafeUser(sender, (err, userSender) => {
            if (err || !userSender) {
                return sock.sendMessage(jid, { text: '「✿」 ERROR DE RED // No pude verificar tu cuenta. 🥀' }, { quoted: m });
            }

            const walletSender = Number(userSender.wallet) || 0;

            if (monto > walletSender) {
                return await sock.sendMessage(jid, { 
                    text: `「✿」 FONDOS INSUFICIENTES 🥀\n\n` +
                          `₊˚ˑ༄ No tienes tantos Bolívares en tu billetera para este duelo.\n` +
                          `❀ *Tu saldo:* \`$${walletSender.toLocaleString('es-CO')} Bolívares\` 📉` 
                }, { quoted: m });
            }

            db.getSafeUser(targetUser, async (errTarget, userTarget) => {
                if (errTarget || !userTarget) {
                    return sock.sendMessage(jid, { text: '「✿」 ERROR DE RED // El rival no está registrado en el sistema. 🥀' }, { quoted: m });
                }

                const walletTarget = Number(userTarget.wallet) || 0;

                if (monto > walletTarget) {
                    return await sock.sendMessage(jid, { 
                        text: `「✿」 RIVAL POBRE 🥀\n\n` +
                          `₊˚ˑ༄ El usuario mencionado no tiene suficientes fondos para cubrir el reto.\n` +
                          `❀ *Su billetera:* \`$${walletTarget.toLocaleString('es-CO')} Bolívares\` 📉` 
                    }, { quoted: m });
                }

                // Definir ganador aleatorio (50/50)
                const ganoSender = Math.random() < 0.5;
                const ganador = ganoSender ? sender : targetUser;
                const perdedor = ganoSender ? targetUser : sender;
                const nombreGanador = ganador.split('@')[0];
                const nombrePerdedor = perdedor.split('@')[0];

                // Transacción atómica en base de datos
                db.serialize(() => {
                    db.run(`UPDATE users SET wallet = wallet - ? WHERE jid = ?`, [monto, perdedor]);
                    db.run(`UPDATE users SET wallet = wallet + ? WHERE jid = ?`, [monto, ganador], async (updateErr) => {
                        if (updateErr) {
                            console.error('Error al procesar duelo:', updateErr.message);
                            return;
                        }

                        await sock.sendMessage(jid, { 
                            text: `「✿」 DUELO FINALIZADO ⚔️🔥\n\n` +
                                  `₊˚ˑ༄ El enfrentamiento ha llegado a su fin.\n` +
                                  `❀ 👑 *Ganador:* @${nombreGanador}\n` +
                                  `❀ 💀 *Derrotado:* @${nombrePerdedor}\n` +
                                  `❀ 💰 *Botín arrebatado:* \`+$${monto.toLocaleString('es-CO')} Bolívares\`\n` +
                                  `───────────────────\n` +
                                  `❀ _¡Una batalla épica en la red de Yuki!_ 🌸`,
                            mentions: [sender, targetUser] 
                        }, { quoted: m });
                    });
                });
            });
        });
    }
};
