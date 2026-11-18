const axios = require('axios');

module.exports = {
    name: 'ass',
    aliases: ['nsfwass'],
    category: 'nsfw',
    description: 'Envía contenido ass desde el ciberespacio',
    
    async execute(sock, m, args, usedPrefix = '!') {
        const jid = m.key.remoteJid;

        try {
            await sock.sendMessage(jid, { 
                text: '「✿」 Buscando en el ciberespacio... ⏳' 
            }, { quoted: m });

            const response = await axios.get('https://api.waifu.im/search?included_tags=ass&is_nsfw=true');
            const imageUrl = response.data?.images?.[0]?.url;
            
            if (!imageUrl) {
                return sock.sendMessage(jid, { 
                    text: '「✿」 ERROR DE RED // No se pudo recuperar el archivo multimedia. 🥀' 
                }, { quoted: m });
            }

            const text = `「✿」 YUKI // MÓDULO NSFW 🔞\n\n` +
                         `₊˚ˑ༄ Archivo recuperado con éxito en la red:\n\n` +
                         `> 📂 *Categoría:* \`ASS\`\n` +
                         `───────────────────\n` +
                         `❀ _Disfruta el contenido en el ciberespacio._ 🌸`;

            await sock.sendMessage(jid, { image: { url: imageUrl }, caption: text }, { quoted: m });

        } catch (error) {
            console.error('Error en comando NSFW ass:', error);
            await sock.sendMessage(jid, { text: '「✿」 ERROR CRÍTICO // Falló la conexión con la API externa. 🥀' }, { quoted: m });
        }
    }
};
