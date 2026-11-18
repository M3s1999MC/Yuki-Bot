const axios = require('axios');

module.exports = {
    name: 'neko',
    aliases: ['nsfwneko'],
    category: 'nsfw',
    description: 'Envía contenido NSFW de la categoría neko',
    
    async execute(sock, m, args, usedPrefix = '!') {
        const jid = m.key.remoteJid;

        try {
            await sock.sendMessage(jid, { 
                text: '「✿」 Buscando en el ciberespacio... ⏳' 
            }, { quoted: m });

            // Petición a la API pública de nekos.dev para contenido NSFW
            const response = await axios.get('https://nekos.dev/api/v3/images?rating=nsfw&category=neko');
            
            // Verificamos que la estructura devuelva la imagen correctamente
            const imageUrl = response.data?.data?.[0]?.url;
            
            if (!imageUrl) {
                return sock.sendMessage(jid, { 
                    text: '「✿」 ERROR DE RED // No se pudo recuperar el archivo multimedia. 🥀' 
                }, { quoted: m });
            }

            const text = `「✿」 YUKI // MÓDULO NSFW 🔞\n\n` +
                         `₊˚ˑ༄ Archivo recuperado con éxito en la red:\n\n` +
                         `> 📂 *Categoría:* \`NEKO\`\n` +
                         `───────────────────\n` +
                         `❀ _Disfruta el contenido en el ciberespacio._ 🌸`;

            await sock.sendMessage(jid, { 
                image: { url: imageUrl }, 
                caption: text 
            }, { quoted: m });

        } catch (error) {
            console.error('Error en comando NSFW neko:', error);
            await sock.sendMessage(jid, { 
                text: '「✿」 ERROR CRÍTICO // Falló la conexión con la API externa. 🥀' 
            }, { quoted: m });
        }
    }
};
