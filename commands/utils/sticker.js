const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { makeSticker } = require('../../utils/stickerMaker');

module.exports = {
    name: 'sticker',
    aliases: ['s'],
    category: 'tools',
    description: 'Convierte una imagen o video en sticker.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const context = m.message?.extendedTextMessage?.contextInfo;
        const quoted = context?.quotedMessage;
        const unwrap = message => message?.ephemeralMessage?.message || message?.viewOnceMessage?.message || message?.viewOnceMessageV2?.message || message;
        const currentMessage = unwrap(m.message);
        const quotedContent = unwrap(quoted);
        const sourceContent = quoted ? quotedContent : currentMessage;
        const image = sourceContent?.imageMessage;
        const video = sourceContent?.videoMessage;
        if (!image && !video) {
            return await sock.sendMessage(jid, { text: '⚠️ Por favor responde a una imagen o envía una con el comando `!sticker`.' }, { quoted: m });
        }

        try {
            await sock.sendMessage(jid, { text: '🔄 Creando sticker...' }, { quoted: m });
            const source = quoted
                ? {
                    key: { ...m.key, id: context?.stanzaId || m.key.id, participant: context?.participant || m.key.participant },
                    message: quotedContent
                }
                : { key: m.key, message: currentMessage };
            const buffer = await downloadMediaMessage(source, 'buffer', {}, { logger: sock.logger || console });
            const sticker = await makeSticker(buffer, { video: Boolean(video) });
            await sock.sendMessage(jid, { sticker }, { quoted: m });
        } catch (err) {
            console.error('Error al crear sticker:', err.message);
            await sock.sendMessage(jid, { text: `❌ No se pudo convertir el archivo en sticker. ${err.message}` }, { quoted: m });
        }
    }
};