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
                return sock.sendMessage(jid, { 
                    text: '₊˚ˑ༄ [!] No pude consultar el estado de la cuenta en la red. 🥀' 
                }, { quoted: m });
            }

            const wallet = Number(user.wallet) || 0;
            const bank = Number(user.bank) || 0;
            const total = wallet + bank;

            const text = `₊˚ˑ༄ 𝖄𝖚𝖐𝖎 // ESTADO FINANCIERO 💳✨\n\n` +
                         `❀ 👤 *Usuario:* @${username}\n` +
                         `❀ 👛 *Billetera:* \`$${wallet.toLocaleString('es-CO')} Bolívares\`\n` +
                         `❀ 🏦 *Banco:* \`$${bank.toLocaleString('es-CO')} Bolívares\`\n` +
                         `───────────────────\n` +
                         `❀ 💎 *Total:* \`$${total.toLocaleString('es-CO')} Bolívares\` 📈`;

            sock.sendMessage(jid, { text, mentions: [target] }, { quoted: m });
        });
    }
};
