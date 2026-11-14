const axios = require('axios');
const https = require('https');

const danbooruApi = axios.create({
    baseURL: 'https://danbooru.donmai.us',
    timeout: 8000,
    httpsAgent: new https.Agent({ keepAlive: true }),
    family: 4,
    headers: {
        'User-Agent': 'YukiBot/1.0 (by tu-usuario)',
        'Accept': 'application/json'
    }
});

// Función para sacar la rareza según tu suerte, bro
function getRareza() {
    const num = Math.floor(Math.random() * 1000) + 1; // 1 al 1000

    if (num <= 600) return { nombre: 'Común', emoji: '⚪' };
    if (num <= 850) return { nombre: 'Rara', emoji: '🔵' };
    if (num <= 970) return { nombre: 'Épica', emoji: '🟣' };
    if (num <= 995) return { nombre: 'Legendaria', emoji: '🟡' };
    return { nombre: 'Mítica', emoji: '🔴' }; // 996 al 1000, 0.5% bro
}

module.exports = {
    name: 'roll',
    aliases: ['rw', 'rollwaifu', 'waifu'],
    category: 'gacha',
    description: 'Tira un personaje directo de Danbooru al instante.',

    async execute(sock, m, args) {
        if (m.isProcessed) return;
        m.isProcessed = true;

        const jid = m.key.remoteJid;

        try {
            let post = null;
            let intentos = 0;

            // Re-intento automático, bro. Busca hasta que salga uno con personaje
            while (!post && intentos < 5) {
                intentos++;
                const response = await danbooruApi.get(`/posts.json?tags=rating:safe+order:random&limit=1`);
                const candidato = response.data[0];

                // Si no tiene imagen o no tiene personaje, lo descartamos y buscamos otro, bro
                if (!candidato || !candidato.file_url) continue;
                if (!candidato.tag_string_character || candidato.tag_string_character.trim() === '') continue;

                post = candidato;
            }

            if (!post) {
                throw new Error('No se encontró personaje con imagen');
            }

            let rawChar = post.tag_string_character.split(' ')[0];
            let rawSerie = post.tag_string_copyright.split(' ')[0] || 'Original';

            const nombre = rawChar.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            const serie = rawSerie.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

            const rareza = getRareza();
            const imagen = post.large_file_url || post.file_url;

            await sock.sendMessage(jid, {
                image: { url: imagen },
                caption: `「✿」 **¡HAS OBTENIDO UN PERSONAJE!** 🌸\n\n` +
                         `• **Nombre:** ${nombre}\n` +
                         `• **Serie / Anime:** ${serie}\n` +
                         `• **Rareza:** ${rareza.emoji} ${rareza.nombre}\n\n` +
                         `💡 Usa tu comando de claim para reclamarlo a tu harem.`
            }, { quoted: m });

        } catch (error) {
            console.error('Error en el comando roll:', error.message);
            await sock.sendMessage(jid, { text: `「✿」 Ups, Danbooru no respondió a tiempo. Inténtalo de nuevo. 🌸` }, { quoted: m });
        }
    }
};
