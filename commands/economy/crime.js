const db = require('../../database/db');

module.exports = {
    name: 'crime',
    aliases: ['crimen'],
    category: 'economy',
    description: 'Comete un crimen para ganar dinero (con riesgo).',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = jid.endsWith('@g.us') ? (m.key.participant || m.key.remoteJid) : jid;

        const success = Math.random() > 0.4;
        const amount = Math.floor(Math.random() * 1500) + 300;
        db.getSafeUser(sender, (ensureErr, user) => {
            if (ensureErr) {
                console.error('Error al registrar usuario para crimen:', ensureErr.message);
                return sock.sendMessage(jid, { text: '「✿」 No pude preparar tu billetera.' }, { quoted: m });
            }
            const loss = Math.min(Number(user.wallet) || 0, amount);
            const change = success ? amount : -loss;
            db.run(`UPDATE users SET wallet = MAX(0, wallet + ?) WHERE jid = ?`, [change, sender], (err) => {
                if (err) {
                    console.error('Error al procesar resultado de crimen:', err.message);
                    return sock.sendMessage(jid, { text: '「✿」 No se pudo actualizar tu billetera.' }, { quoted: m });
                }
                const text = success
                    ? `「✿」 ¡Escapaste! Ganaste *+$${amount.toLocaleString('es-CO')}*. 🦹`
                    : `「✿」 Te atraparon y perdiste *$${loss.toLocaleString('es-CO')}* en multas. 🚨`;
                sock.sendMessage(jid, { text }, { quoted: m });
            });
        });
    }
};