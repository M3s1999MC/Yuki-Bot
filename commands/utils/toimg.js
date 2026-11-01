const sharp = require('sharp');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'toimg',
    aliases: ['toimage'],
    category: 'utilidades',
    description: 'Convierte un sticker WebP en una imagen PNG.',

    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const quotedMessage = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quotedMessage?.stickerMessage) {
            return sock.sendMessage(jid, { text: '「✿」 Responde a un sticker con !toimg para convertirlo.' }, { quoted: m });
        }

        try {
            const buffer = await downloadMediaMessage(
                { key: m.key, message: quotedMessage },
                'buffer',
                {},
                { logger: console }
            );
            const image = await sharp(buffer, { animated: false })
                .rotate()
                .png()
                .toBuffer();
            await sock.sendMessage(jid, {
                image,
                caption: '「✿」 Sticker convertido a PNG. 🌸'
            }, { quoted: m });
        } catch (err) {
            console.error('Error al convertir sticker a imagen:', err);
            await sock.sendMessage(jid, { text: '「✿」 No se pudo convertir el sticker.' }, { quoted: m });
        }
    }
};
