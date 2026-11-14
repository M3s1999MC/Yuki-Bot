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
            // Pedimos 1 post random, solo safe, bro
            const response = await danbooruApi.get(`/posts.json?tags=rating:safe+order:random&limit=1`);
            const post = response.data[0];

            if (!post || !post.file_url) {
                throw new Error('Sin imagen');
            }

            // Danbooru te da los tags, bro. Sacamos personaje y serie de ahí
            // tag_string_character = "hatsune_miku" -> lo dejamos bonito
            // tag_string_copyright = "vocaloid" -> la serie
            let rawChar = post.tag_string_character.split(' ')[0] || 'Desconocido';
            let rawSerie = post.tag_string_copyright.split(' ')[0] || 'Original / Desconocido';

            // Para que se vea bonito: hatsune_miku -> Hatsune Miku
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
