const axios = require('axios');

module.exports = {
    name: 'waifu',
    aliases: ['nsfwwaifu'],
    category: 'nsfw',
    description: 'Envía una imagen o GIF NSFW de waifus',
    
    async execute(sock, m, args) {
        const categoria = 'waifu'; 
        const tipo = 'nsfw';

        try {
            await sock.sendMessage(m.key.remoteJid, { text: '「✿」 Buscando en el ciberespacio... 🌸' }, { quoted: m });

            const response = await axios.get(`https://api.waifu.pics/${tipo}/${categoria}`);
            
            if (!response.data || !response.data.url) {
                return sock.sendMessage(m.key.remoteJid, { text: '❌ Ocurrió un error al obtener la imagen.' }, { quoted: m });
            }

            await sock.sendMessage(m.key.remoteJid, { 
                image: { url: response.data.url }, 
                caption: `「✿」 Categoría: **${categoria.toUpperCase()}** 🔞✨` 
            }, { quoted: m });

        } catch (error) {
            console.error('Error en comando NSFW waifu:', error);
            await sock.sendMessage(m.key.remoteJid, { text: '⚠️ Hubo un fallo al conectar con la API.' }, { quoted: m });
        }
    }
};
