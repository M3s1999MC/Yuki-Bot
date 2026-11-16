// utils/duelReply.js
// !aceptar y !rechazar sirven para propuestas de matrimonio y para duelos. Si no hay propuesta pendiente,
// el mensaje se trata como respuesta a un reto de !duelo (el usuario cita el mensaje del reto).
const { respondToDuel } = require('./pendingDuels');
const { getMessageContent } = require('./messageContent');
const { getMessageSenderJid } = require('./messageSender');

/** @returns {Promise<boolean>} true si el mensaje citaba algo y se trató como respuesta a un duelo */
async function tryRespondToDuel(sock, m, action) {
    const content = getMessageContent(m.message) || {};
    const challengeId = content.extendedTextMessage?.contextInfo?.stanzaId;
    if (!challengeId) return false;
    try {
        await respondToDuel({
            id: challengeId,
            chatJid: m.key.remoteJid,
            responder: getMessageSenderJid(m, sock),
            action,
            sock,
            responseMessage: m
        });
    } catch (error) {
        console.error('No se pudo procesar la respuesta al duelo:', error.message);
        await sock.sendMessage(m.key.remoteJid, { text: '「✿」 No se pudo procesar la respuesta al duelo. Inténtalo de nuevo.' }, { quoted: m });
    }
    return true;
}

module.exports = { tryRespondToDuel };
