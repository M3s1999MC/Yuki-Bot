// monthly.js
const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'monthly',
    category: 'economia',
    description: 'Reclama tu recompensa mensual.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const ahora = Date.now();
        const cooldown = 30 * 24 * 60 * 60 * 1000; // 30 días
        const premio = 50000;

        db.getSafeUser(sender, (err, user) => {
            if (err) {
                console.error('Error al registrar usuario para recompensa mensual:', err.message);
                return sock.sendMessage(jid, { text: '「✿」 No pude consultar tu cuenta.' }, { quoted: m });
            }
            const last = Number(user.lastMonthly) || 0;

            if (ahora - last < cooldown) {
                const restante = Math.ceil((cooldown - (ahora - last)) / (1000 * 60 * 60 * 24));
                return sock.sendMessage(jid, { text: `「✿」 Ya reclamaste tu recompensa mensual. Vuelve en *${restante} día(s)*. ⏳` }, { quoted: m });
            }

            db.run(`UPDATE users SET wallet = wallet + ?, lastMonthly = ? WHERE jid = ? AND (lastMonthly IS NULL OR lastMonthly <= ?)`,
                [premio, ahora, sender, ahora - cooldown], function(updateErr) {
                if (updateErr || !this.changes) {
                    if (updateErr) console.error('Error al otorgar recompensa mensual:', updateErr.message);
                    return sock.sendMessage(jid, { text: '「✿」 No se pudo reclamar la recompensa; vuelve a intentarlo.' }, { quoted: m });
                }
                sock.sendMessage(jid, { text: `「✿」 Recompensa mensual: *+$${premio.toLocaleString('es-CO')}* 🌸` }, { quoted: m });
            });
        });
    }
};