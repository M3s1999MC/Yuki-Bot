const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'deposit',
    aliases: ['depositar', 'dep'],
    category: 'economy',
    description: 'Deposita tus Bolívares de tu billetera al banco central.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);

        db.getSafeUser(sender, (err, user) => {
            if (err) {
                console.error('Error al registrar usuario para depositar:', err.message);
                return sock.sendMessage(jid, { 
                    text: '(「✿」 "ERROR DE RED" 🥀)\n\nNo pude consultar el estado de tu billetera en el sistema.' 
                }, { quoted: m });
            }

            const wallet = Number(user.wallet) || 0;
            const value = (args[0] || '').toLowerCase();
            const amount = ['all', 'todo', 'todas'].includes(value) ? wallet : Number(value);

            if (!Number.isSafeInteger(amount) || amount <= 0) {
                return sock.sendMessage(jid, { 
                    text: `(「✿」 "DEPÓSITO BANCARIO" 🏦)\n\n` +
                          `₊˚ˑ༄ Indica una cantidad entera válida o deposita todo tu efectivo.\n` +
                          `❀ *Uso:* \`!deposit <cantidad|all>\`\n` +
                          `❀ *Ejemplo:* \`!deposit 1000\` 🌸` 
                }, { quoted: m });
            }

            if (amount > wallet) {
                return sock.sendMessage(jid, { 
                    text: `(「✿」 "FONDOS INSUFICIENTES" 🥀)\n\n` +
                          `₊˚ˑ༄ No tienes tantos Bolívares disponibles en tu billetera.\n` +
                          `❀ 👛 *Billetera actual:* \`$${wallet.toLocaleString('es-CO')} Bolívares\` 📉` 
                }, { quoted: m });
            }

            db.run(`UPDATE users SET wallet = wallet - ?, bank = bank + ? WHERE jid = ? AND wallet >= ?`,
                [amount, amount, sender, amount], function(updateErr) {
                    if (updateErr || !this.changes) {
                        if (updateErr) console.error('Error al depositar:', updateErr.message);
                        return sock.sendMessage(jid, { 
                            text: '(「✿」 "TRANSACCIÓN FALLIDA" 🥀)\n\nNo se pudo completar la transferencia al banco; inténtalo de nuevo.' 
                        }, { quoted: m });
                    }

                    const nuevoBanco = (Number(user.bank) || 0) + amount;

                    sock.sendMessage(jid, { 
                        text: `(「✿」 "DEPÓSITO EXITOSO" 🏦✨)\n\n` +
                              `₊˚ˑ༄ Transferencia asegurada en la bóveda central de Yuki.\n` +
                              `❀ 💵 *Depositado:* \`$${amount.toLocaleString('es-CO')} Bolívares\`\n` +
                              `❀ 💳 *Total en Banco:* \`$${nuevoBanco.toLocaleString('es-CO')} Bolívares\`\n` +
                              `───────────────────\n` +
                              `❀ _¡Tus fondos están a salvo de robos en el chat!_ 🔒🌸`,
                        mentions: [sender]
                    }, { quoted: m });
                });
        });
    }
};
