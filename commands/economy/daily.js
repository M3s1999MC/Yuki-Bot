const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'daily',
    aliases: ['diario'],
    category: 'economy',
    description: 'Reclama tu recompensa diaria de Bolívares.',

    async execute(sock, m, args, usedPrefix = '!') {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const now = Date.now();
        const cooldown = 24 * 60 * 60 * 1000; // 24 horas
        const reward = 1500;

        db.getSafeUser(sender, (err, user) => {
            if (err) {
                console.error('Error al registrar usuario para recompensa diaria:', err.message);
                return sock.sendMessage(jid, { text: '「✿」 ERROR DE RED // No pude consultar tu cuenta en el sistema central. 🥀' }, { quoted: m });
            }

            const last = Number(user.lastDaily) || 0;

            if (now - last < cooldown) {
                const remainingMs = cooldown - (now - last);
                const hours = Math.floor(remainingMs / (1000 * 60 * 60));
                const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

                return sock.sendMessage(jid, { 
                    text: `「✿」 RECOMPENSA EN ESPERA ⏳\n\n` +
                          `₊˚ˑ༄ Ya reclamaste tu subsidio de hoy.\n` +
                          `❀ Podrás volver en: *${hours}h ${minutes}m* ☕` 
                }, { quoted: m });
            }

            // Actualización directa y segura sin bloqueos innecesarios en el WHERE
            db.run(`UPDATE users SET wallet = wallet + ?, lastDaily = ? WHERE jid = ?`,
                [reward, now, sender], function(updateErr) {
                    if (updateErr) {
                        console.error('Error al otorgar recompensa diaria:', updateErr.message);
                        return sock.sendMessage(jid, { text: '「✿」 ERROR CRÍTICO // No se pudo reclamar la recompensa. 🥀' }, { quoted: m });
                    }

                    const recompensaFormateada = reward.toLocaleString('es-CO');

                    const text = `「✿」 ¡RECOMPENSA RECLAMADA! 🎉✨\n\n` +
                                 `₊˚ˑ༄ Subsidio oficial acreditado en tu billetera.\n` +
                                 `❀ 💰 *Obtenido:* \`+$${recompensaFormateada} Bolívares\`\n` +
                                 `───────────────────\n` +
                                 `❀ _¡Vuelve mañana para más fondos contra la hiperinflación!_ 🌸`;

                    sock.sendMessage(jid, { text, mentions: [sender] }, { quoted: m });
                });
        });
    }
};
