const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'daily',
    category: 'economy',
    description: 'Reclama tu recompensa diaria de Bolívares.',

    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const now = Date.now();
        const cooldown = 24 * 60 * 60 * 1000;
        const reward = 1500;

        db.getSafeUser(sender, (err, user) => {
            if (err) {
                console.error('Error al registrar usuario para recompensa diaria:', err.message);
                return sock.sendMessage(jid, { text: '(「✿」 "ERROR DE RED" 🥀)\n\nNo pude consultar tu cuenta en el sistema central.' }, { quoted: m });
            }

            const last = Number(user.lastDaily) || 0;
            
            if (now - last < cooldown) {
                const remainingMs = cooldown - (now - last);
                const hours = Math.floor(remainingMs / (1000 * 60 * 60));
                const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

                return sock.sendMessage(jid, { 
                    text: `(「✿」 "RECOMPENSA DIARIA EN ESPERA" ⏳)\n\n` +
                          `₊˚ˑ༄ Ya reclamaste tu subsidio de hoy.\n` +
                          `❀ Podrás volver en: *${hours}h ${minutes}m* ☕` 
                }, { quoted: m });
            }

            db.run(`UPDATE users SET wallet = wallet + ?, lastDaily = ? WHERE jid = ? AND (lastDaily IS NULL OR lastDaily <= ?)`,
                [reward, now, sender, now - cooldown], function(updateErr) {
                    if (updateErr || !this.changes) {
                        if (updateErr) console.error('Error al otorgar recompensa diaria:', updateErr.message);
                        return sock.sendMessage(jid, { text: '(「✿」 "ERROR CRÍTICO" 🥀)\n\nNo se pudo reclamar la recompensa; vuelve a intentarlo.' }, { quoted: m });
                    }

                    const recompensaFormateada = reward.toLocaleString('es-CO');

                    sock.sendMessage(jid, { 
                        text: `(「✿」 "¡RECOMPENSA DIARIA RECLAMADA!" 🌸)\n\n` +
                              `₊˚ˑ༄ Subsidio oficial acreditado en tu billetera.\n` +
                              `❀ 💰 *Obtenido:* \`+$${recompensaFormateada} Bolívares\` 💵\n` +
                              `───────────────────\n` +
                              `❀ _¡Vuelve mañana para más fondos contra la hiperinflación!_ ✨`,
                        mentions: [sender] 
                    }, { quoted: m });
                });
        });
    }
};
