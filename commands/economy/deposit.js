const db = require('../../database/db');

module.exports = {
    name: 'deposit',
    aliases: ['depositar', 'dep'],
    category: 'economy',
    description: 'Deposita dinero de tu billetera al banco.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = jid.endsWith('@g.us') ? (m.key.participant || jid) : jid;
        db.getSafeUser(sender, (err, user) => {
            if (err) {
                console.error('Error al registrar usuario para depositar:', err.message);
                return sock.sendMessage(jid, { text: '「✿」 No pude consultar tu billetera.' }, { quoted: m });
            }
            const wallet = Number(user.wallet) || 0;
            const value = (args[0] || '').toLowerCase();
            const amount = ['all', 'todo'].includes(value) ? wallet : Number(value);
            if (!Number.isSafeInteger(amount) || amount <= 0) {
                return sock.sendMessage(jid, { text: '「✿」 Indica una cantidad entera o usa !deposit all.' }, { quoted: m });
            }
            if (amount > wallet) {
                return sock.sendMessage(jid, { text: '「✿」 No tienes suficiente dinero en tu billetera.' }, { quoted: m });
            }
            db.run(`UPDATE users SET wallet = wallet - ?, bank = bank + ? WHERE jid = ? AND wallet >= ?`,
                [amount, amount, sender, amount], function(updateErr) {
                    if (updateErr || !this.changes) {
                        if (updateErr) console.error('Error al depositar:', updateErr.message);
                        return sock.sendMessage(jid, { text: '「✿」 No se pudo completar el depósito.' }, { quoted: m });
                    }
                    sock.sendMessage(jid, { text: `「✿」 Depositaste *$${amount.toLocaleString('es-CO')}* en el banco. 🏦` }, { quoted: m });
                });
        });
    }
};
