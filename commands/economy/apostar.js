const db = require('../../database/db');
const duelCommand = require('./duelo');
const { getMessageContent } = require('../../utils/messageContent');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'apostar',
    aliases: ['bet', 'ruleta'],
    category: 'economy',
    description: 'Apuesta contra el bot o reta a otro jugador si lo mencionas.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const content = getMessageContent(m.message);
        const context = content.extendedTextMessage?.contextInfo || {};
        const mentionedJids = context.mentionedJid || [];

        if (mentionedJids.length) {
            return duelCommand.execute(sock, m, args);
        }

        if (args.some(arg => arg.startsWith('@'))) {
            return sock.sendMessage(jid, {
                text: '「✿」 Para retar a un jugador, menciónalo correctamente: !apostar @usuario <cantidad>.'
            }, { quoted: m });
        }

        if (args.length !== 1 || !/^\d+$/.test(args[0])) {
            return sock.sendMessage(jid, {
                text: '「✿」 Usa !apostar <cantidad> o !ruleta <cantidad> para jugar contra el bot. Para retar a alguien: !apostar @usuario <cantidad>.'
            }, { quoted: m });
        }
        const amount = Number(args[0]);
        if (!Number.isSafeInteger(amount) || amount <= 0) {
            return sock.sendMessage(jid, {
                text: '「✿」 Indica una cantidad entera positiva. Ejemplo: !apostar 50'
            }, { quoted: m });
        }

        db.getSafeUser(sender, (ensureErr, user) => {
            if (ensureErr) {
                console.error('Error al preparar cuenta para apuesta:', ensureErr.message);
                return sock.sendMessage(jid, { text: '「✿」 No pude consultar tu billetera.' }, { quoted: m });
            }

            if ((Number(user.wallet) || 0) < amount) {
                return sock.sendMessage(jid, { text: '「✿」 No tienes suficiente saldo en la billetera para esa apuesta.' }, { quoted: m });
            }

            const won = Math.random() < 0.5;
            const maxWallet = Number.MAX_SAFE_INTEGER - amount;
            const query = won
                ? 'UPDATE users SET wallet = wallet + ? WHERE jid = ? AND wallet >= 0 AND wallet <= ?'
                : 'UPDATE users SET wallet = wallet - ? WHERE jid = ? AND wallet >= ?';
            const params = won
                ? [amount, sender, maxWallet]
                : [amount, sender, amount];

            db.run(query, params, function(updateErr) {
                if (updateErr || !this.changes) {
                    if (updateErr) console.error('Error al procesar apuesta:', updateErr.message);
                    return sock.sendMessage(jid, {
                        text: '「✿」 No se pudo procesar la apuesta. Puede que tu saldo haya cambiado; consulta !balance e inténtalo de nuevo.'
                    }, { quoted: m });
                }

                const result = won
                    ? `「✿」 ¡Ganaste! 🎉 Duplicaste tu apuesta de *$${amount.toLocaleString('es-CO')}*.`
                    : `「✿」 Esta vez perdiste. 🎲 Se descontaron *$${amount.toLocaleString('es-CO')}* de tu billetera.`;
                sock.sendMessage(jid, { text: result }, { quoted: m });
            });
        });
    }
};
