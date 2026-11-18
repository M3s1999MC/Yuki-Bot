const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'transfer',
    aliases: ['transferir', 'pay', 'dar'],
    category: 'economy',
    description: 'Transfiere Bolívares desde tu billetera hacia la cuenta de otro usuario en la red.',

    async execute(sock, m, args, usedPrefix = '!') {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const context = m.message?.extendedTextMessage?.contextInfo;
        const target = context?.mentionedJid?.[0] || context?.participant;
        
        // Buscar el monto numérico en los argumentos
        const amountArg = args.find(arg => /^\d+$/.test(arg));
        const amount = Number(amountArg);

        if (!target || !Number.isSafeInteger(amount) || amount <= 0) {
            return sock.sendMessage(jid, { 
                text: `「✿」 TRANSFERENCIA BANCARIA 💸✨\n\n` +
                      `₊˚ˑ༄ Envía fondos a otro usuario de forma segura:\n` +
                      `❀ *Uso:* \`${usedPrefix}transfer @usuario <monto>\`\n` +
                      `❀ *Ejemplo:* \`${usedPrefix}transfer @usuario 1500\` 🌸` 
            }, { quoted: m });
        }

        if (target === sender) {
            return sock.sendMessage(jid, { 
                text: '「✿」 AUTO-TRANSFERENCIA IMPOSIBLE 🥀\n\n₊˚ˑ༄ No puedes transferir fondos a tu propia cuenta en el ciberespacio.' 
            }, { quoted: m });
        }

        db.getSafeUser(target, (targetErr) => {
            if (targetErr) {
                console.error('Error al registrar destinatario de transferencia:', targetErr.message);
                return sock.sendMessage(jid, { text: '「✿」 ERROR DE RED // No pude preparar la cuenta del destinatario. 🥀' }, { quoted: m });
            }

            const rollback = (text, error) => db.run('ROLLBACK', (rollbackErr) => {
                if (rollbackErr) console.error('Error al revertir transferencia:', rollbackErr.message);
                if (error) console.error('Error en transferencia:', error.message);
                sock.sendMessage(jid, { text }, { quoted: m });
            });

            db.run('BEGIN IMMEDIATE', (beginErr) => {
                if (beginErr) {
                    console.error('No se pudo iniciar transferencia:', beginErr.message);
                    return sock.sendMessage(jid, { text: '「✿」 ERROR CRÍTICO // No se pudo iniciar la transacción bancaria. 🥀' }, { quoted: m });
                }

                db.run(
                    `UPDATE users SET wallet = wallet - ? WHERE jid = ? AND wallet >= ?`,
                    [amount, sender, amount],
                    function(debitErr) {
                        if (debitErr || !this.changes) {
                            return rollback(
                                `「✿」 FONDOS INSUFICIENTES 🥀\n\n₊˚ˑ༄ No tienes suficientes Bolívares en tu billetera para realizar esta transferencia.`,
                                debitErr
                            );
                        }

                        db.run(`UPDATE users SET wallet = wallet + ? WHERE jid = ?`, [amount, target], (creditErr) => {
                            if (creditErr) return rollback('「✿」 ERROR // No se pudo acreditar el dinero al destinatario.', creditErr);

                            db.run('COMMIT', (commitErr) => {
                                if (commitErr) return rollback('「✿」 ERROR // No se pudo confirmar la transferencia.', commitErr);

                                const amountFormatted = amount.toLocaleString('es-CO');
                                const text = `「✿」 TRANSFERENCIA EXITOSA 💸✨\n\n` +
                                             `₊˚ˑ༄ Has enviado fondos a otro miembro en la red.\n` +
                                             `❀ 👤 *Remitente:* @${sender.split('@')[0]}\n` +
                                             `❀ 👤 *Destinatario:* @${target.split('@')[0]}\n` +
                                             `❀ 💰 *Monto transferido:* \`$${amountFormatted} Bolívares\`\n` +
                                             `───────────────────\n` +
                                             `❀ _¡Transacción completada de forma segura por el Banco de Yuki!_ 🌸`;

                                sock.sendMessage(jid, { text, mentions: [sender, target] }, { quoted: m });
                            });
                        });
                    }
                );
            });
        });
    }
};
