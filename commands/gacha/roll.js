const axios = require('axios');

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

            // 1. Intentamos Danbooru por proxy, bro. Así Cloudflare no nos bloquea
            try {
                const proxyUrl = 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent('https://danbooru.donmai.us/posts.json?tags=rating:safe+order:random&limit=10');
                const res = await axios.get(proxyUrl, { timeout: 10000 });
                const lista = res.data;
                const conPersonaje = lista.filter(p => p.tag_string_character && p.tag_string_character.trim() !== '' && p.file_url);
                if (conPersonaje.length > 0) {
                    const elegido = conPersonaje[Math.floor(Math.random() * conPersonaje.length)];
                    post = {
                        nombre: elegido.tag_string_character.split(' ')[0],
                        serie: elegido.tag_string_copyright.split(' ')[0] || 'Original',
                        imagen: elegido.large_file_url || elegido.file_url
                    };
                }
            } catch (e) { console.log('Proxy Danbooru falló:', e.message); }

            // 2. Si eso falla, último respaldo: Waifu.im, bro. Ese SÍ deja entrar a Suga
            if (!post) {
                const resWaifu = await axios.get('https://api.waifu.im/search?included_tags=waifu&is_nsfw=false&many=false', { timeout: 10000 });
                const data = resWaifu.data.images[0];
                post = {
                    nombre: data.tags?.[0]?.name || 'Waifu',
                    serie: 'Waifu.im / Original',
                    imagen: data.url
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
