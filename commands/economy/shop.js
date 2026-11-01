const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'tienda',
    aliases: ['shop'],
    category: 'economy',
    description: 'Consulta la tienda o compra tickets de captura.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const subcommand = (args[0] || '').toLowerCase();
        const item = (args[1] || '').toLowerCase();
        if (!['buy', 'comprar'].includes(subcommand)) {
            return sock.sendMessage(jid, {
                text: args.length
                    ? '「✿」 Usa !shop buy ticket para comprar un ticket.'
                    : `「✿」 Tienda de Yuki 🌸\n\n🎟️ Ticket de captura — *$1,500*\n_Compra con !shop buy ticket_`
            }, { quoted: m });
        }
        if (!['ticket', 'tickets'].includes(item)) {
            return sock.sendMessage(jid, { text: '「✿」 El artículo disponible es *ticket*. Usa !shop buy ticket.' }, { quoted: m });
        }

        const price = 1500;
        db.getSafeUser(sender, (err) => {
            if (err) {
                console.error('Error al registrar usuario para comprar en tienda:', err.message);
                return sock.sendMessage(jid, { text: '「✿」 No pude preparar tu cuenta.' }, { quoted: m });
            }
            db.run(`UPDATE users SET wallet = wallet - ?, tickets = tickets + 1 WHERE jid = ? AND wallet >= ?`,
                [price, sender, price], function(purchaseErr) {
                    if (purchaseErr || !this.changes) {
                        if (purchaseErr) console.error('Error al comprar ticket:', purchaseErr.message);
                        return sock.sendMessage(jid, { text: '「✿」 No tienes saldo suficiente para comprar un ticket.' }, { quoted: m });
                    }
                    sock.sendMessage(jid, { text: '「✿」 Compraste 1 ticket por *$1,500*. Ya puedes usar !atrapar <ID>. 🎟️🌸' }, { quoted: m });
                });
        });
    }
};
