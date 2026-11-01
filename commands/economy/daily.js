const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'daily',
    category: 'economy',
    description: 'Reclama tu recompensa diaria.',

    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const now = Date.now();
        const cooldown = 24 * 60 * 60 * 1000;
        const reward = 1500;

        db.getSafeUser(sender, (err, user) => {
            if (err) {
                console.error('Error al registrar usuario para recompensa diaria:', err.message);
                return sock.sendMessage(jid, { text: '「✿」 No pude consultar tu cuenta.' }, { quoted: m });
            }
            const last = Number(user.lastDaily) || 0;
            if (now - last < cooldown) {
                const hours = Math.ceil((cooldown - (now - last)) / 3600000);
                return sock.sendMessage(jid, { text: `「✿」 Ya reclamaste tu recompensa diaria. Vuelve en *${hours} h*. ⏳` }, { quoted: m });
            }
            db.run(`UPDATE users SET wallet = wallet + ?, lastDaily = ? WHERE jid = ? AND (lastDaily IS NULL OR lastDaily <= ?)`,
                [reward, now, sender, now - cooldown], function(updateErr) {
                    if (updateErr || !this.changes) {
                        if (updateErr) console.error('Error al otorgar recompensa diaria:', updateErr.message);
                        return sock.sendMessage(jid, { text: '「✿」 No se pudo reclamar la recompensa; vuelve a intentarlo.' }, { quoted: m });
                    }
                    sock.sendMessage(jid, { text: `「✿」 Recompensa diaria: *+$${reward.toLocaleString('es-CO')}* 🌸` }, { quoted: m });
                });
        });
    }
};
