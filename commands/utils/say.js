const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'say',
    aliases: ['decir'],
    category: 'utilidades',
    description: 'Envía texto o repite multimedia citada.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const text = args.join(' ').trim();
        const quotedMessage = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!text && !quotedMessage) {
            return sock.sendMessage(jid, { text: '「✿」 Escribe un texto o responde a un archivo multimedia.' }, { quoted: m });
        }
        if (!quotedMessage) {
            return sock.sendMessage(jid, { text }, { quoted: m });
        }

        const message = quotedMessage.ephemeralMessage?.message || quotedMessage;
        const mediaType = Object.keys(message).find(key => [
            'imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'
        ].includes(key));
        if (!mediaType) {
            return sock.sendMessage(jid, { text: text || '「✿」 El mensaje citado no contiene multimedia compatible.' }, { quoted: m });
        }

        try {
            const buffer = await downloadMediaMessage({ key: m.key, message: quotedMessage }, 'buffer', {}, { logger: console });
            const media = message[mediaType];
            let payload;
            if (mediaType === 'imageMessage') payload = { image: buffer, caption: text || media.caption || '' };
            else if (mediaType === 'videoMessage') payload = { video: buffer, caption: text || media.caption || '', gifPlayback: Boolean(media.gifPlayback) };
            else if (mediaType === 'audioMessage') payload = { audio: buffer, mimetype: media.mimetype || 'audio/mpeg', ptt: Boolean(media.ptt) };
            else if (mediaType === 'documentMessage') payload = {
                document: buffer,
                mimetype: media.mimetype || 'application/octet-stream',
                fileName: media.fileName || 'archivo',
                caption: text || media.caption || ''
            };
            else payload = { sticker: buffer };
            await sock.sendMessage(jid, payload, { quoted: m });
        } catch (err) {
            console.error('Error al repetir multimedia:', err);
            await sock.sendMessage(jid, { text: '「✿」 No se pudo enviar el contenido citado.' }, { quoted: m });
        }
    }
};
