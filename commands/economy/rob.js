const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'rob',
    aliases: ['robar'],
    category: 'economy',
    description: 'Intenta robarle a otro usuario.',

    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const context = m.message?.extendedTextMessage?.contextInfo;
        const target = context?.mentionedJid?.[0] || context?.participant;
        if (!target) {
            return sock.sendMessage(jid, { text: '「✿」 Menciona o responde a la persona a quien quieres robar.' }, { quoted: m });
        }
        if (target === sender) {
            return sock.sendMessage(jid, { text: '「✿」 No puedes robarte a ti mismo.' }, { quoted: m });
        }

        db.getSafeUser(sender, (senderErr, actor) => {
            if (senderErr) {
                console.error('Error al registrar usuario para robo:', senderErr.message);
                return sock.sendMessage(jid, { text: '「✿」 No pude preparar tu cuenta.' }, { quoted: m });
            }
            db.getSafeUser(target, (targetErr, victim) => {
                if (targetErr) {
                    console.error('Error al registrar objetivo de robo:', targetErr.message);
                    return sock.sendMessage(jid, { text: '「✿」 No pude consultar la cuenta de esa persona.' }, { quoted: m });
                }
                const available = Number(victim.wallet) || 0;
                if (!available) {
                    return sock.sendMessage(jid, { text: '「✿」 Esa persona no tiene dinero en su billetera.' }, { quoted: m });
                }

                const success = Math.random() < 0.5;
                const amount = Math.min(available, Math.max(1, Math.floor(available * (0.1 + Math.random() * 0.3))));
                const penalty = Math.min(Number(actor.wallet) || 0, 100);
                db.run('BEGIN IMMEDIATE', (beginErr) => {
                    if (beginErr) {
                        console.error('No se pudo iniciar robo:', beginErr.message);
                        return sock.sendMessage(jid, { text: '「✿」 No se pudo iniciar el intento.' }, { quoted: m });
                    }
                    const rollback = (error) => db.run('ROLLBACK', (rollbackErr) => {
                        if (rollbackErr) console.error('Error al revertir robo:', rollbackErr.message);
                        if (error) console.error('Error al procesar robo:', error.message);
                        sock.sendMessage(jid, { text: '「✿」 No se pudo procesar la operación.' }, { quoted: m });
                    });
                    if (!success) {
                        db.run(`UPDATE users SET wallet = wallet - ? WHERE jid = ? AND wallet >= ?`, [penalty, sender, penalty], (lossErr) => {
                            if (lossErr) return rollback(lossErr);
                            db.run('COMMIT', (commitErr) => {
                                if (commitErr) return rollback(commitErr);
                                sock.sendMessage(jid, { text: `「✿」 Te descubrieron y pagaste *$${penalty.toLocaleString('es-CO')}* de multa. 🚨` }, { quoted: m });
                            });
                        });
                        return;
                    }

                    db.run(`UPDATE users SET wallet = wallet - ? WHERE jid = ? AND wallet >= ?`, [amount, target, amount], function(debitErr) {
                        if (debitErr || !this.changes) return rollback(debitErr || new Error('El saldo del objetivo cambió.'));
                        db.run(`UPDATE users SET wallet = wallet + ? WHERE jid = ?`, [amount, sender], (creditErr) => {
                            if (creditErr) return rollback(creditErr);
                            db.run('COMMIT', (commitErr) => {
                                if (commitErr) return rollback(commitErr);
                                sock.sendMessage(jid, {
                                    text: `「✿」 @${sender.split('@')[0]} robó *$${amount.toLocaleString('es-CO')}* a @${target.split('@')[0]}. 🥷`,
                                    mentions: [sender, target]
                                }, { quoted: m });
                            });
                        });
                    });
                });
            });
        });
    }
};
