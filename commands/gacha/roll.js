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

            // 1. Intentamos Danbooru por proxy
            try {
                const proxyUrl = 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent('https://danbooru.donmai.us/posts.json?tags=rating:safe+order:random&limit=15');
                const res = await axios.get(proxyUrl, { timeout: 8000 });
                const lista = res.data;
                
                // Filtramos posts que tengan personaje, serie y una imagen válida que no sea muy problemática
                const validos = lista.filter(p => p.tag_string_character && p.tag_string_character.trim() !== '' && (p.large_file_url || p.file_url));
                
                if (validos.length > 0) {
                    const elegido = validos[Math.floor(Math.random() * validos.length)];
                    
                    // Limpiamos el primer nombre de personaje si viene con paréntesis (ej: "asuka_(evangelion)")
                    let rawName = elegido.tag_string_character.split(' ')[0];
                    let rawSeries = elegido.tag_string_copyright ? elegido.tag_string_copyright.split(' ')[0] : 'Original';

                    post = {
                        nombre: rawName.replace(/_/g, ' ').replace(/\(.+\)/g, '').trim(),
                        serie: rawSeries.replace(/_/g, ' ').replace(/\(.+\)/g, '').trim(),
                        imagen: elegido.large_file_url || elegido.file_url
                    };
                }
            } catch (e) { 
                console.log('Proxy Danbooru falló, usando respaldo:', e.message); 
            }

            // 2. Si Danbooru falla o no encuentra nada, usamos Waifu.im de respaldo
            if (!post) {
                const resWaifu = await axios.get('https://api.waifu.im/search?included_tags=waifu&is_nsfw=false&many=false', { timeout: 8000 });
                const data = resWaifu.data.images[0];
                
                let waifuName = 'Waifu';
                if (data.tags && data.tags.length > 0 && data.tags[0].name) {
                    waifuName = data.tags[0].name;
                }

                post = {
                    nombre: waifuName,
                    serie: 'Waifu.im / Original',
                    imagen: data.url
                };
            }

            // Formatear nombres con mayúsculas iniciales bonitas
            const nombre = post.nombre.replace(/\b\w/g, l => l.toUpperCase());
            const serie = post.serie.replace(/\b\w/g, l => l.toUpperCase());
            const rareza = getRareza();

            // Descargamos la imagen como buffer para evitar que Baileys falle con URLs directas inestables
            const imgRes = await axios.get(post.imagen, { responseType: 'arraybuffer', timeout: 10000 });
            const imageBuffer = Buffer.from(imgRes.data);

            await sock.sendMessage(jid, {
                            image: imageBuffer,
                            caption: `╭━━━ $\\mathfrak{YUKI'S\\ GACHA}$ ━━━╮\n` +
                                     `┃ 🌸 **¡NUEVO PERSONAJE OBTENIDO!**\n` +
                                     `┣━━━━━━━━━━━━━━━━━━\n` +
                                     `┃ • **Nombre:** \`${nombre}\`\n` +
                                     `┃ • **Serie:** \`${serie}\`\n` +
                                     `┃ • **Rareza:** ${rareza.emoji} **${rareza.nombre}**\n` +
                                     `╰━━━━━━━━━━━━━━━━━━╯\n\n` +
                                     `> 💡 Responde o usa tu comando de claim para añadirlo a tu harem.`
                        }, { quoted: m });

        } catch (error) {
            console.error('Error en el comando roll:', error.message);
            await sock.sendMessage(jid, { text: `「✿」 Ups, hubo un fallo conectando con las APIs de imágenes. Inténtalo de nuevo. 🌸` }, { quoted: m });
        }
    }
};
