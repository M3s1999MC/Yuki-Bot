// utils/usedCommand.js
// Los comandos reciben (sock, m, args, usedPrefix) pero no el nombre exacto con el que se invocaron,
// así que los archivos con varios alias lo sacan del texto del mensaje.
const { getMessageContent } = require('./messageContent');

function getUsedCommand(m) {
    const content = getMessageContent(m.message) || {};
    const body = content.conversation
        || content.extendedTextMessage?.text
        || content.imageMessage?.caption
        || content.videoMessage?.caption
        || '';
    return body.replace(/^[!.\/#]/, '').trim().split(/\s+/)[0].toLowerCase();
}

module.exports = { getUsedCommand };
