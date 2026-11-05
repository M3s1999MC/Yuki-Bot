const db = require('../database/db');

module.exports = {
    name: 'prestamo',
    aliases: ['prestar'],
    description: 'Solicita un préstamo al banco de Yuki',
    async execute(sock, m) {
        const jid = m.key.participant || m.key.remoteJid;
        const monto = 2000;

        db.getSafeUser(jid, async (err, user) => {
            if (err || !user) return;
            const nuevoSaldo = (user.wallet || 0) + monto;

            db.run(`UPDATE users SET wallet = ? WHERE jid = ?`, [nuevoSaldo, jid], async () => {
                await sock.sendMessage(m.key.remoteJid, { 
                    text: `🏦 *PRÉSTAMO APROBADO*\n\nSe han depositado +$${monto.toLocaleString()} en tu billetera.\n⚠️ *Recuerda saldar tus deudas con !pagardeuda.*`
                }, { quoted: m });
            });
        });
    }
};
