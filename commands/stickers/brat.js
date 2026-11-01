const { makeBratSticker } = require('../../utils/stickerMaker');

module.exports = {
    name: 'brat',
    category: 'tools',
    description: 'Crea un sticker estilo brat con texto.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const text = args.join(' ');

        if (!text) {
            return await sock.sendMessage(jid, { text: '⚠️ Por favor escribe un texto para generar el sticker estilo brat.\n\n*Ejemplo:* `!brat Hola mundo`' }, { quoted: m });
        }

        try {
            const sticker = await makeBratSticker(text);
            await sock.sendMessage(jid, { sticker }, { quoted: m });
        } catch (err) {
            console.error('Error generando sticker brat:', err.message);
            await sock.sendMessage(jid, { text: '❌ No se pudo generar el sticker brat.' }, { quoted: m });
        }
    }
};