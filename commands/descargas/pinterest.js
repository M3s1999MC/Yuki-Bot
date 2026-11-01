const { searchPinterestImageBuffer } = require('../../utils/imageSearch');

module.exports = {
    name: 'pinterest',
    aliases: ['pin', 'pinsearch'],
    category: 'downloads',
    description: 'Busca y envía una imagen aleatoria de Pinterest según un texto.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const query = args.join(' ');

        if (!query) {
            return await sock.sendMessage(jid, { text: '⚠️ Por favor ingresa qué deseas buscar en Pinterest.\n\n*Ejemplo:* `!pinterest K-ON aesthetic`' }, { quoted: m });
        }

        try {
            await sock.sendMessage(jid, { text: `🔍 Buscando imágenes en Pinterest para: *${query}*...` }, { quoted: m });
            const image = await searchPinterestImageBuffer(query);
            await sock.sendMessage(jid, { image, caption: `「✿」 Resultado de Pinterest: *${query}* 🌸` }, { quoted: m });
        } catch (err) {
            console.error('Error buscando imagen en Pinterest:', err.message);
            await sock.sendMessage(jid, { text: `❌ No se pudo obtener una imagen. ${err.message}` }, { quoted: m });
        }
    }
};