const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'banco',
    aliases: ['bank'],
    category: 'economy',
    description: 'Revisa el estado detallado e intereses de tu cuenta bancaria',
    
    async execute(sock, m) {
        const sender = getMessageSenderJid(m, sock);
        const remoteJid = m.key.remoteJid;

        db.getSafeUser(sender, async (err, user) => {
            if (err || !user) {
                return sock.sendMessage(remoteJid, { 
                    text: '₊˚ˑ༄ [!] No pude acceder a los registros del banco central. 🥀' 
                }, { quoted: m });
            }

            const banco = Number(user.bank) || 0;
            const interesEstimado = Math.floor(banco * 0.02);

            const text = `₊˚ˑ༄ 𝖄𝖚𝖐𝖎 // BANCO CENTRAL 🏦✨\n\n` +
                         `❀ 💳 *Saldo en Banco:* \`$${banco.toLocaleString('es-CO')} Bolívares\`\n` +
                         `❀ 📈 *Interés Diario (2%):* \`+$${interesEstimado.toLocaleString('es-CO')} Bolívares\`\n` +
                         `───────────────────\n` +
                         `❀ _¡Guarda tu dinero seguro en la red de Yuki antes de que sufra hiperinflación!_ 🔒🌸`;

            await sock.sendMessage(remoteJid, { text }, { quoted: m });
        });
    }
};
