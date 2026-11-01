const db = require('../../database/db');
const { getBalanceTargetJid } = require('../../utils/messageSender');

module.exports = {
    name: 'balance',
    aliases: ['bal', 'saldo'],
    category: 'economy',
    description: 'Muestra tu saldo actual de billetera y banco.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const target = getBalanceTargetJid(m, sock);

        const username = target.split('@')[0];
        db.getSafeUser(target, (ensureErr, user) => {
            if (ensureErr) {
                console.error('Error al registrar usuario para consultar saldo:', ensureErr.message);
                return sock.sendMessage(jid, { text: '「✿」 No pude consultar el saldo.' }, { quoted: m });
            }
            const wallet = Number(user.wallet) || 0;
            const bank = Number(user.bank) || 0;
            const text = `「✿」 Saldo de @${username} 🌸\n\n` +
                `👛 Billetera: *$${wallet.toLocaleString('es-CO')}*\n` +
                `🏦 Banco: *$${bank.toLocaleString('es-CO')}*\n` +
                `💎 Total: *$${(wallet + bank).toLocaleString('es-CO')}*`;
            sock.sendMessage(jid, { text, mentions: [target] }, { quoted: m });
        });
    }
};