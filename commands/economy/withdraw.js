const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'withdraw',
    aliases: ['retirar', 'wd'],
    category: 'economy',
    description: 'Retira dinero del banco a tu billetera.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        db.getSafeUser(sender, (err, user) => {
            if (err) {
                console.error('Error al registrar usuario para retirar:', err.message);
                return sock.sendMessage(jid, { text: '「✿」 No pude consultar tu banco.' }, { quoted: m });
            }
            const bank = Number(user.bank) || 0;
            const value = (args[0] || '').toLowerCase();
            const amount = ['all', 'todo'].includes(value) ? bank : Number(value);
            if (!Number.isSafeInteger(amount) || amount <= 0) {
                return sock.sendMessage(jid, { text: '「✿」 Indica una cantidad entera o usa !withdraw all.' }, { quoted: m });
            }
            if (amount > bank) {
                return sock.sendMessage(jid, { text: '「✿」 No tienes suficiente dinero en el banco.' }, { quoted: m });
            }
            db.run(`UPDATE users SET bank = bank - ?, wallet = wallet + ? WHERE jid = ? AND bank >= ?`,
                [amount, amount, sender, amount], function(updateErr) {
                    if (updateErr || !this.changes) {
                        if (updateErr) console.error('Error al retirar dinero:', updateErr.message);
                        return sock.sendMessage(jid, { text: '「✿」 No se pudo completar el retiro.' }, { quoted: m });
                    }
                    sock.sendMessage(jid, { text: `「✿」 Retiraste *$${amount.toLocaleString('es-CO')}* a tu billetera. 👛` }, { quoted: m });
                });
        });
    }
};
