const axios = require('axios');

module.exports = {
    name: 'neko',
    aliases: ['nsfwneko'],
    category: 'nsfw',
    description: 'Envía una imagen NSFW de la categoría neko',
    
    async execute(sock, m, args) {
        const categoria = 'neko'; 
        const tipo = 'nsfw';

        try {
            await sock.sendMessage(m.key.remoteJid, { text: '「✿」 Buscando en el ciberespacio... 🌸' }, { quoted: m });

            const response = await axios.get(`https://api.waifu.pics/${tipo}/${categoria}`);
            
            if (!response.data || !response.data.url) {
                return sock.sendMessage(m.key.remoteJid, { text: '❌ Ocurrió un error al obtener la imagen.' }, { quoted: m });
            }

            const mediaUrl = response.data.url;

            await sock.sendMessage(m.key.remoteJid, { 
                image: { url: mediaUrl }, 
                caption: `「✿」 Categoría: **${categoria.toUpperCase()}** 🔞✨` 
            }, { quoted: m });

        } catch (error) {
            console.error('Error en comando NSFW:', error);
            await sock.sendMessage(m.key.remoteJid, { text: '⚠️ Hubo un fallo al conectar con la API.' }, { quoted: m });
        }
    }
};
