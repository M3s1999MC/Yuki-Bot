const axios = require('axios');

module.exports = {
    name: 'kitsune',
    aliases: ['nsfwkitsune'],
    category: 'nsfw',
    description: 'Envía contenido kitsune desde el ciberespacio',
    
    async execute(sock, m, args, usedPrefix = '!') {
        const jid = m.key.remoteJid;

        try {
            await sock.sendMessage(jid, { 
                text: '「✿」 Buscando en el ciberespacio... ⏳' 
            }, { quoted: m });

            const response = await axios.get('https://nekos.best/api/v2/kitsune');
            const imageUrl = response.data?.results?.[0]?.url;
            
            if (!imageUrl) {
                return sock.sendMessage(jid, { 
                    text: '「✿」 ERROR DE RED // No se pudo recuperar el archivo multimedia. 🥀' 
                }, { quoted: m });
            }

            const text = `「✿」 YUKI // MÓDULO NSFW 🔞\n\n` +
                         `₊˚ˑ༄ Archivo recuperado con éxito en la red:\n\n` +
                         `> 📂 *Categoría:* \`KITSUNE\`\n` +
                         `───────────────────\n` +
                         `❀ _Disfruta el contenido en el ciberespacio._ 🌸`;

            await sock.sendMessage(jid, { image: { url: imageUrl }, caption: text }, { quoted: m });

        } catch (error) {
            console.error('Error en comando NSFW kitsune:', error);
            await sock.sendMessage(jid, { text: '「✿」 ERROR CRÍTICO // Falló la conexión con la API externa. 🥀' }, { quoted: m });
        }
    }
};
