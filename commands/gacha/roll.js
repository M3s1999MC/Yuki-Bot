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

function getRareza() {
    const num = Math.floor(Math.random() * 1000) + 1;
    if (num <= 600) return { nombre: 'Común', emoji: '⚪' };
    if (num <= 850) return { nombre: 'Rara', emoji: '🔵' };
    if (num <= 970) return { nombre: 'Épica', emoji: '🟣' };
    if (num <= 995) return { nombre: 'Legendaria', emoji: '🟡' };
    return { nombre: 'Mítica', emoji: '🔴' };
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

            // 1. Intenta Danbooru, bro
            while (!post && intentos < 3) {
                intentos++;
                try {
                    const response = await danbooruApi.get(`/posts.json?tags=rating:safe+order:random&limit=1`);
                    const candidato = response.data[0];
                    if (!candidato || !candidato.file_url) continue;
                    if (!candidato.tag_string_character || candidato.tag_string_character.trim() === '') continue;
                    post = { 
                        nombre: candidato.tag_string_character.split(' ')[0],
                        serie: candidato.tag_string_copyright.split(' ')[0] || 'Original',
                        imagen: candidato.large_file_url || candidato.file_url
                    };
                } catch (e) { console.log('Danbooru falló, intentando Safebooru...', e.message); break; }
            }

            // 2. Si Danbooru falló, se va a Safebooru, bro
            if (!post) {
                const resSafe = await axios.get('https://safebooru.org/index.php?page=dapi&s=post&q=index&json=1&limit=20&tags=rating:safe+order:random', { timeout: 8000 });
                // Safebooru devuelve muchos, escogemos uno con personaje
                const candidatos = resSafe.data.filter(p => p.tags && p.tags.includes(' ') || p.tags);
                const elegido = candidatos[Math.floor(Math.random() * candidatos.length)];
                if (!elegido) throw new Error('Safebooru sin datos');

                // En Safebooru los tags vienen todos juntos, bro, buscamos el de personaje por el formato
                // Safebooru no separa character/copyright, así que usamos el primer tag que no sea general
                let tags = elegido.tags.split(' ');
                let nombreRaw = tags[0] || 'Desconocido';

                post = {
                    nombre: nombreRaw,
                    serie: 'Safebooru / Original',
                    imagen: elegido.sample_url || elegido.file_url
                };
            }

            const nombre = post.nombre.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            const serie = post.serie.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            const rareza = getRareza();

            await sock.sendMessage(jid, {
                image: { url: post.imagen },
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
