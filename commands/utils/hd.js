const sharp = require('sharp');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'hd',
    aliases: ['enhance', 'remini'],
    category: 'utilidades',
    description: 'Amplía y mejora la nitidez de una imagen.',

    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const context = m.message?.extendedTextMessage?.contextInfo;
        const quotedMessage = context?.quotedMessage;
        const source = m.message?.imageMessage
            ? m
            : quotedMessage?.imageMessage
                ? { key: m.key, message: quotedMessage }
                : null;
        if (!source) {
            return sock.sendMessage(jid, { text: '「✿」 Envía o responde a una imagen con !hd.' }, { quoted: m });
        }

        try {
            const buffer = await downloadMediaMessage(source, 'buffer', {}, { logger: console });
            const image = sharp(buffer).rotate();
            const metadata = await image.metadata();
            if (!metadata.width || !metadata.height) {
                return sock.sendMessage(jid, { text: '「✿」 No pude leer las dimensiones de esta imagen.' }, { quoted: m });
            }
            const scale = Math.min(2, 2048 / Math.max(metadata.width, metadata.height));
            const enhanced = await image
                .resize({
                    width: Math.max(1, Math.round(metadata.width * scale)),
                    height: Math.max(1, Math.round(metadata.height * scale)),
                    fit: 'inside'
                })
                .sharpen({ sigma: 1.1 })
                .webp({ quality: 92, effort: 4 })
                .toBuffer();
            await sock.sendMessage(jid, {
                image: enhanced,
                caption: '「✿」 Imagen ampliada y optimizada. 🌸'
            }, { quoted: m });
        } catch (err) {
            console.error('Error al mejorar imagen:', err);
            await sock.sendMessage(jid, { text: '「✿」 No se pudo procesar la imagen.' }, { quoted: m });
        }
    }
};
