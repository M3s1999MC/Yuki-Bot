const { respondToDuel } = require('../../utils/pendingDuels');
const { getMessageContent } = require('../../utils/messageContent');

module.exports = {
    name: 'aceptar',
    aliases: ['rechazar'],
    category: 'economy',
    description: 'Acepta o rechaza un duelo respondiendo al mensaje del reto.',

    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const sender = jid.endsWith('@g.us') ? (m.key.participant || jid) : jid;
        const content = getMessageContent(m.message);
        const body = content.conversation || content.extendedTextMessage?.text || '';
        const action = body.replace(/^!/, '').trim().split(/\s+/)[0].toLowerCase();
        const challengeId = content.extendedTextMessage?.contextInfo?.stanzaId;

        if (!['aceptar', 'rechazar'].includes(action)) return;
        if (!challengeId) {
            return sock.sendMessage(jid, {
                text: '「✿」 Responde directamente al mensaje del reto con !aceptar o !rechazar.'
            }, { quoted: m });
        }

        try {
            await respondToDuel({
                id: challengeId,
                chatJid: jid,
                responder: sender,
                action,
                sock,
                responseMessage: m
            });
        } catch (err) {
            console.error('No se pudo procesar la respuesta al duelo:', err.message);
            await sock.sendMessage(jid, {
                text: '「✿」 No se pudo procesar la respuesta al duelo. Inténtalo de nuevo.'
            }, { quoted: m });
        }
    }
};
