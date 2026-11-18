const axios = require('axios');

module.exports = {
    name: 'neko',
    aliases: ['nsfwneko'],
    category: 'nsfw',
    description: 'Envía contenido NSFW de la categoría neko',
    
    async execute(sock, m, args, usedPrefix = '!') {
        const jid = m.key.remoteJid;
        const categoria = 'neko';
        const tipo = 'nsfw';

        try {
            await sock.sendMessage(jid, { 
                text: '「✿」 Buscando en el ciberespacio... ⏳' 
            }, { quoted: m });

            const response = await axios.get(`https://api.waifu.pics/${tipo}/${categoria}`);
            
            if (!response.data || !response.data.url) {
                return sock.sendMessage(jid, { 
                    text: '「✿」 ERROR DE RED // No se pudo recuperar el archivo multimedia. 🥀' 
                }, { quoted: m });
            }

            const text = `「✿」 YUKI // MÓDULO NSFW 🔞\n\n` +
                         `₊˚ˑ༄ Archivo recuperado con éxito en la red:\n\n` +
                         `> 📂 *Categoría:* \`${categoria.toUpperCase()}\`\n` +
                         `───────────────────\n` +
                         `❀ _Disfruta el contenido en el ciberespacio._ 🌸`;

            await sock.sendMessage(jid, { 
                image: { url: response.data.url }, 
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
