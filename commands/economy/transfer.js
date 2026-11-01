const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'transfer',
    aliases: ['transferir', 'pay', 'dar'],
    category: 'economy',
    description: 'Transfiere dinero de tu billetera a otro usuario.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const context = m.message?.extendedTextMessage?.contextInfo;
        const target = context?.mentionedJid?.[0] || context?.participant;
        const amount = Number(args.find(arg => /^\d+$/.test(arg)));

        if (!target || !Number.isSafeInteger(amount) || amount <= 0) {
            return sock.sendMessage(jid, { text: '「✿」 Usa !transfer @usuario cantidad.' }, { quoted: m });
        }
        if (target === sender) {
            return sock.sendMessage(jid, { text: '「✿」 No puedes transferirte dinero a ti mismo.' }, { quoted: m });
        }

        db.getSafeUser(target, (targetErr) => {
            if (targetErr) {
                console.error('Error al registrar destinatario de transferencia:', targetErr.message);
                return sock.sendMessage(jid, { text: '「✿」 No pude preparar la cuenta del destinatario.' }, { quoted: m });
            }
            const rollback = (text, error) => db.run('ROLLBACK', (rollbackErr) => {
                if (rollbackErr) console.error('Error al revertir transferencia:', rollbackErr.message);
                if (error) console.error('Error en transferencia:', error.message);
                sock.sendMessage(jid, { text }, { quoted: m });
            });
            db.run('BEGIN IMMEDIATE', (beginErr) => {
                if (beginErr) {
                    console.error('No se pudo iniciar transferencia:', beginErr.message);
                    return sock.sendMessage(jid, { text: '「✿」 No se pudo iniciar la transferencia.' }, { quoted: m });
                }
                db.run(`UPDATE users SET wallet = wallet - ? WHERE jid = ? AND wallet >= ?`,
                    [amount, sender, amount], function(debitErr) {
                        if (debitErr || !this.changes) {
                            return rollback('「✿」 No tienes suficiente saldo en la billetera.', debitErr);
                        }
                        db.run(`UPDATE users SET wallet = wallet + ? WHERE jid = ?`, [amount, target], (creditErr) => {
                            if (creditErr) return rollback('「✿」 No se pudo acreditar el dinero al destinatario.', creditErr);
                            db.run('COMMIT', (commitErr) => {
                                if (commitErr) return rollback('「✿」 No se pudo confirmar la transferencia.', commitErr);
                                sock.sendMessage(jid, {
                                    text: `「✿」 @${sender.split('@')[0]} transfirió *$${amount.toLocaleString('es-CO')}* a @${target.split('@')[0]}. 💸`,
                                    mentions: [sender, target]
                                }, { quoted: m });
                            });
                        });
                    });
            });
        });
    }
};
