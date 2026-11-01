// weekly.js
const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'weekly',
    category: 'economia',
    description: 'Reclama tu recompensa semanal.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const ahora = Date.now();
        const cooldown = 7 * 24 * 60 * 60 * 1000; // 7 días
        const premio = 10000;

        db.getSafeUser(sender, (err, user) => {
            if (err) {
                console.error('Error al registrar usuario para recompensa semanal:', err.message);
                return sock.sendMessage(jid, { text: '「✿」 No pude consultar tu cuenta.' }, { quoted: m });
            }
            const last = Number(user.lastWeekly) || 0;

            if (ahora - last < cooldown) {
                const restante = Math.ceil((cooldown - (ahora - last)) / (1000 * 60 * 60 * 24));
                return sock.sendMessage(jid, { text: `「✿」 Ya reclamaste tu recompensa semanal. Vuelve en *${restante} día(s)*. ⏳` }, { quoted: m });
            }

            db.run(`UPDATE users SET wallet = wallet + ?, lastWeekly = ? WHERE jid = ? AND (lastWeekly IS NULL OR lastWeekly <= ?)`,
                [premio, ahora, sender, ahora - cooldown], function(updateErr) {
                if (updateErr || !this.changes) {
                    if (updateErr) console.error('Error al otorgar recompensa semanal:', updateErr.message);
                    return sock.sendMessage(jid, { text: '「✿」 No se pudo reclamar la recompensa; vuelve a intentarlo.' }, { quoted: m });
                }
                sock.sendMessage(jid, { text: `「✿」 Recompensa semanal: *+$${premio.toLocaleString('es-CO')}* 🌸` }, { quoted: m });
            });
        });
    }
};