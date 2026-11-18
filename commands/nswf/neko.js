const axios = require('axios');

module.exports = {
    name: 'neko', // Cambia según el comando (neko, waifu, trap, blowjob)
    aliases: ['nsfwneko'],
    category: 'nsfw',
    description: 'Envía contenido NSFW aleatorio con el estilo de Yuki',
    
    async execute(sock, m, args) {
        const categoria = 'neko'; // Cambia según la categoría del archivo
        const tipo = 'nsfw';

        try {
            // Estilo visual clásico de Yuki procesando en el ciberespacio
            await sock.sendMessage(m.key.remoteJid, { 
                text: '「✿」 Conectando con los servidores del ciberespacio... 🔄✨' 
            }, { quoted: m });

            const response = await axios.get(`https://api.waifu.pics/${tipo}/${categoria}`);
            
            if (!response.data || !response.data.url) {
                return sock.sendMessage(m.key.remoteJid, { 
                    text: '「❌」 Error crítico: No se pudo recuperar el archivo multimedia.' 
                }, { quoted: m });
            }

            // Envío con el formato estético de Yuki
            await sock.sendMessage(m.key.remoteJid, { 
                image: { url: response.data.url }, 
                caption: `「✿」 **YUKI-BOT // MÓDULO NSFW** 🔞\n\n` +
                         `* **Categoría:** ${categoria.toUpperCase()}\n` +
                         `* **Estado:** Transmisión exitosa 🚀`
            }, { quoted: m });

        } catch (error) {
            console.error('Error en comando NSFW:', error);
            await sock.sendMessage(m.key.remoteJid, { 
                text: '「⚠️」 Fallo de red al intentar conectar con la API.' 
            }, { quoted: m });
        }
    }
};
