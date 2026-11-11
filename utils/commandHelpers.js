// utils/commandHelpers.js
// Utilidades comunes para los comandos: texto del mensaje, comando usado, objetivo mencionado y respuesta rápida.
// Todo desempaqueta primero el mensaje (mensajes temporales, ver una vez, etc.) con getMessageContent.
const { getMessageContent } = require('./messageContent');
const { getUsedCommand } = require('./usedCommand');
const { getMessageSenderJid } = require('./messageSender');

function messageText(m) {
    const content = getMessageContent(m?.message) || {};
    return content.conversation
        || content.extendedTextMessage?.text
        || content.imageMessage?.caption
        || content.videoMessage?.caption
        || '';
}

/** Comando exacto que escribió el usuario (minúsculas, sin prefijo). Sirve cuando un módulo tiene varios alias. */
function usedCommand(m) {
    return getUsedCommand(m || {});
}

function contextInfo(m) {
    const content = getMessageContent(m?.message) || {};
    return content.extendedTextMessage?.contextInfo
        || content.imageMessage?.contextInfo
        || content.videoMessage?.contextInfo
        || null;
}

/** Usuario mencionado o autor del mensaje citado. Devuelve null si no hay ninguno. */
function targetJid(m) {
    const context = contextInfo(m);
    const mentioned = context?.mentionedJid?.find(jid => typeof jid === 'string' && jid);
    return mentioned || context?.participant || null;
}

function mentionTag(jid) {
    return `@${String(jid || '').split('@')[0].split(':')[0]}`;
}

function senderJid(m, sock) {
    return getMessageSenderJid(m, sock);
}

function reply(sock, m, text, mentions = []) {
    const content = mentions.length ? { text, mentions } : { text };
    return sock.sendMessage(m.key.remoteJid, content, { quoted: m });
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickOne(list) {
    return list[Math.floor(Math.random() * list.length)];
}

module.exports = { messageText, usedCommand, contextInfo, targetJid, mentionTag, senderJid, reply, randomInt, pickOne };
