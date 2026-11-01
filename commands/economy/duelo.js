const db = require('../../database/db');
const { addPendingDuel } = require('../../utils/pendingDuels');
const { getMessageContent } = require('../../utils/messageContent');

module.exports = {
    name: 'duelo',
    aliases: [],
    category: 'economy',
    description: 'Desafía a otro usuario a una apuesta 1v1 que debe aceptar.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = jid.endsWith('@g.us') ? (m.key.participant || jid) : jid;
        const content = getMessageContent(m.message);
        const mentionedJids = content.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const target = mentionedJids[0];
        const amountArgs = args.filter(arg => /^\d+$/.test(arg));
        const amount = amountArgs.length === 1 ? Number(amountArgs[0]) : NaN;

        if (!jid.endsWith('@g.us') || mentionedJids.length !== 1 || !target ||
            amountArgs.length !== 1 || !Number.isSafeInteger(amount) || amount <= 0) {
            return sock.sendMessage(jid, {
                text: '「✿」 Usa !duelo @usuario <cantidad> en un grupo. Ejemplo: !duelo @usuario 100. El contrincante debe aceptar el reto.'
            }, { quoted: m });
        }
        if (target === sender) {
            return sock.sendMessage(jid, { text: '「✿」 No puedes retarte a ti mismo.' }, { quoted: m });
        }

        db.getSafeUser(sender, (ensureErr, user) => {
            if (ensureErr) {
                console.error('Error al preparar cuenta para duelo:', ensureErr.message);
                return sock.sendMessage(jid, { text: '「✿」 No pude consultar tu billetera.' }, { quoted: m });
            }
            if ((Number(user.wallet) || 0) < amount) {
                return sock.sendMessage(jid, {
                    text: '「✿」 No tienes suficiente saldo para proponer esa apuesta.'
                }, { quoted: m });
            }

            sock.sendMessage(jid, {
                text: `「✿」 @${target.split('@')[0]}, @${sender.split('@')[0]} te reta a un duelo de *$${amount.toLocaleString('es-CO')}*.\n\nResponde a este mensaje con *!aceptar* o *!rechazar*. Tienes 45 segundos. Si aceptas, ambos deben tener saldo suficiente; el perdedor paga la apuesta al ganador.`,
                mentions: [sender, target]
            }, { quoted: m }).then(challenge => {
                if (!challenge?.key?.id) {
                    throw new Error('WhatsApp no devolvió el identificador del mensaje del reto.');
                }
                addPendingDuel({
                    id: challenge.key.id,
                    chatJid: jid,
                    challenger: sender,
                    opponent: target,
                    amount,
                    sock,
                    challengeKey: challenge.key
                });
            }).catch(sendErr => {
                console.error('No se pudo enviar o registrar el reto de duelo:', sendErr.message);
                sock.sendMessage(jid, {
                    text: '「✿」 No se pudo enviar el reto. Inténtalo de nuevo.'
                }, { quoted: m });
            });
        });
    }
};
