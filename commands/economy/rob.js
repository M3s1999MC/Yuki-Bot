const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');
const { claim, formatDuration } = require('../../utils/cooldowns');

module.exports = {
    name: 'rob',
    aliases: ['robar', 'atracar'],
    category: 'economy',
    description: 'Intenta robarle Bolívares a otro usuario del chat (con riesgo de multa si te atrapan).',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const username = sender.split('@')[0];
        
        const targetUser = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

        if (!targetUser) {
            return sock.sendMessage(jid, { 
                text: `「✿」 INTENTO DE ROBO 🦹‍♂️✨\n\n` +
                      `₊˚ˑ༄ Debes mencionar al usuario al que deseas atracar en la red.\n` +
                      `❀ *Uso:* \`!rob @usuario\` 🌸`,
                mentions: [sender]
            }, { quoted: m });
        }

        if (targetUser === sender) {
            return sock.sendMessage(jid, { 
                text: '「✿」 AUTO-ROBO IMPOSIBLE 🥀\n\n₊˚ˑ༄ No puedes robarte a ti mismo en el ciberespacio.' 
            }, { quoted: m });
        }

        // Cooldown de 30 minutos para evitar abuso del comando
        const cooldown = await claim(sender, 'rob', 30 * 60 * 1000);
        if (!cooldown.ok) {
            const remainingFormatted = formatDuration(cooldown.remainingMs);
            return sock.sendMessage(jid, { 
                text: `「✿」 COOLDOWN DE ROBO ⏳\n\n` +
                      `₊˚ˑ༄ La policía cibernética vigila tus pasos. Estás bajo perfil.\n` +
                      `❀ Podrás volver a intentar un asalto en: *${remainingFormatted}* ☕` 
            }, { quoted: m });
        }

        db.getSafeUser(sender, async (errSender, userSender) => {
            if (errSender || !userSender) {
                return sock.sendMessage(jid, { text: '「✿」 ERROR DE RED // No pude verificar tu cuenta. 🥀' }, { quoted: m });
            }

            db.getSafeUser(targetUser, async (errTarget, userTarget) => {
                if (errTarget || !userTarget) {
                    return sock.sendMessage(jid, { text: '「✿」 ERROR DE RED // El usuario objetivo no está registrado en la red. 🥀' }, { quoted: m });
                }

                const targetWallet = Number(userTarget.wallet) || 0;

                if (targetWallet < 1000) {
                    return sock.sendMessage(jid, { 
                        text: `「✿」 VÍCTIMA SIN FONDOS 🥀\n\n` +
                              `₊˚ˑ༄ @${targetUser.split('@')[0]} es demasiado pobre en este momento; no vale la pena arriesgarse.`,
                        mentions: [targetUser]
                    }, { quoted: m });
                }

                // 45% de probabilidad de éxito
                const exito = Math.random() < 0.45;

                if (exito) {
                    // Roba entre el 10% y el 25% de la billetera de la víctima (máximo 5,000 Bolívares)
                    const porcentaje = Math.random() * 0.15 + 0.10;
                    const robado = Math.min(5000, Math.floor(targetWallet * porcentaje));

                    db.run(`UPDATE users SET wallet = wallet - ? WHERE jid = ?`, [robado, targetUser], (err1) => {
                        if (err1) return;
                        db.run(`UPDATE users SET wallet = wallet + ? WHERE jid = ?`, [robado, sender], async (err2) => {
                            if (err2) return;

                            const robadoFormatted = robado.toLocaleString('es-CO');
                            const text = `「✿」 ROBO EXITOSO 🦹‍♂️✨\n\n` +
                                         `₊˚ˑ༄ ¡Operación de sigilo completada con éxito en el ciberespacio!\n` +
                                         `❀ 💸 *Botín hurtado:* \`+$${robadoFormatted} Bolívares\`\n` +
                                         `❀ 👤 *Víctima:* @${targetUser.split('@')[0]}\n` +
                                         `───────────────────\n` +
                                         `❀ _¡Cuidado con la ley de la red de Yuki!_ 🌸`;

                            await sock.sendMessage(jid, { text, mentions: [targetUser, sender] }, { quoted: m });
                        });
                    });
                } else {
                    // Multa por fracaso: 1,500 Bolívares (o lo que tenga en billetera)
                    const multa = Math.min(Number(userSender.wallet) || 0, 1500);

                    db.run(`UPDATE users SET wallet = wallet - ? WHERE jid = ?`, [multa, sender], async (errMulta) => {
                        if (errMulta) return;

                        const multaFormatted = multa.toLocaleString('es-CO');
                        const text = `「✿」 ¡ATRAPADO IN FRAGANTI! 🚨🥀\n\n` +
                                     `₊˚ˑ༄ @${targetUser.split('@')[0]} te descubrió intentando saquear sus bolsillos y llamó a seguridad.\n` +
                                     `❀ 💸 *Multa pagada:* \`-$${multaFormatted} Bolívares\`\n` +
                                     `───────────────────\n` +
                                     `❀ _¡El crimen cibernético no paga en la red de Yuki!_ 📉`;

                        await sock.sendMessage(jid, { text, mentions: [targetUser, sender] }, { quoted: m });
                    });
                }
            });
        });
    }
};
