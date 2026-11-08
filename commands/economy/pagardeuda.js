const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'pagardeuda',
    aliases: ['pagarprestamo'],
    description: 'Paga las cuotas o salda la deuda de tu préstamo',
    async execute(sock, m) {
        const jid = getMessageSenderJid(m, sock);
        const pago = 2000;

        db.getSafeUser(jid, async (err, user) => {
            if (err || !user) return;
            if ((user.wallet || 0) < pago) return sock.sendMessage(m.key.remoteJid, { text: '❌ No tienes saldo suficiente para saldar la cuota.' }, { quoted: m });

            const nuevoSaldo = user.wallet - pago;
            db.run(`UPDATE users SET wallet = ? WHERE jid = ?`, [nuevoSaldo, jid], async () => {
                await sock.sendMessage(m.key.remoteJid, { text: `✅ ¡Has pagado tu cuota de $${pago.toLocaleString()} con éxito!` }, { quoted: m });
            });
        });
    }
};
