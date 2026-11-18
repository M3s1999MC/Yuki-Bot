const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'withdraw',
    aliases: ['retirar', 'wd'],
    category: 'economy',
    description: 'Retira Bolívares desde tu cuenta bancaria hacia tu billetera personal en la red.',

    async execute(sock, m, args, usedPrefix = '!') {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const username = sender.split('@')[0];

        db.getSafeUser(sender, (err, user) => {
            if (err) {
                console.error('Error al registrar usuario para retirar:', err.message);
                return sock.sendMessage(jid, { text: '「✿」 ERROR DE RED // No pude consultar tu cuenta bancaria. 🥀' }, { quoted: m });
            }

            const bank = Number(user.bank) || 0;
            const value = (args[0] || '').toLowerCase();
            const amount = ['all', 'todo'].includes(value) ? bank : Number(value);

            if (!Number.isSafeInteger(amount) || amount <= 0) {
                return sock.sendMessage(jid, { 
                    text: `「✿」 RETIRO BANCARIO 🏦✨\n\n` +
                          `₊˚ˑ༄ Transfiere fondos desde tu banco hacia tu billetera:\n` +
                          `❀ *Uso:* \`${usedPrefix}withdraw <cantidad>\` o \`${usedPrefix}withdraw all\`\n` +
                          `❀ *Saldo en banco:* \`$${bank.toLocaleString('es-CO')} Bolívares\` 🌸` 
                }, { quoted: m });
            }

            if (amount > bank) {
                const bankF = bank.toLocaleString('es-CO');
                const amountF = amount.toLocaleString('es-CO');

                return sock.sendMessage(jid, { 
                    text: `「✿」 FONDOS INSUFICIENTES EN BANCO 🥀\n\n` +
                          `₊˚ˑ༄ No tienes tanto dinero depositado en tu cuenta bancaria.\n` +
                          `❀ *Intentas retirar:* \`$${amountF} Bolívares\`\n` +
                          `❀ *Saldo actual:* \`$${bankF} Bolívares\` 📉` 
                }, { quoted: m });
            }

            db.run(
                `UPDATE users SET bank = bank - ?, wallet = wallet + ? WHERE jid = ? AND bank >= ?`,
                [amount, amount, sender, amount],
                function(updateErr) {
                    if (updateErr || !this.changes) {
                        if (updateErr) console.error('Error al retirar dinero:', updateErr.message);
                        return sock.sendMessage(jid, { text: '「✿」 ERROR CRÍTICO // No se pudo completar el retiro bancario. 🥀' }, { quoted: m });
                    }

                    const amountF = amount.toLocaleString('es-CO');
                    const text = `「✿」 RETIRO BANCARIO EXITOSO 🏦✨\n\n` +
                                 `₊˚ˑ༄ Has retirado fondos de tu cuenta hacia tu billetera personal.\n` +
                                 `❀ 👤 *Usuario:* @${username}\n` +
                                 `❀ 💸 *Monto retirado:* \`+$${amountF} Bolívares\`\n` +
                                 `───────────────────\n` +
                                 `❀ _¡Operación procesada con seguridad por el Banco de Yuki!_ 🌸`;

                    sock.sendMessage(jid, { text, mentions: [sender] }, { quoted: m });
                }
            );
        });
    }
};
