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
    description: 'Tira un personaje directo al instante.',

    async execute(sock, m, args) {
        if (m.isProcessed) return;
        m.isProcessed = true;
        const jid = m.key.remoteJid;

        try {
            let post = null;

            // 1. Intento principal: Danbooru por proxy
            try {
                const proxyUrl = 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent('https://danbooru.donmai.us/posts.json?tags=rating:safe+order:random&limit=15');
                const res = await axios.get(proxyUrl, { timeout: 6000 });
                const lista = res.data;
                const validos = lista.filter(p => p.tag_string_character && p.tag_string_character.trim() !== '' && (p.large_file_url || p.file_url));
                
                if (validos.length > 0) {
                    const elegido = validos[Math.floor(Math.random() * validos.length)];
                    let rawName = elegido.tag_string_character.split(' ')[0];
                    let rawSeries = elegido.tag_string_copyright ? elegido.tag_string_copyright.split(' ')[0] : 'Original';

                    post = {
                        nombre: rawName.replace(/_/g, ' ').replace(/\(.+\)/g, '').trim(),
                        serie: rawSeries.replace(/_/g, ' ').replace(/\(.+\)/g, '').trim(),
                        imagen: elegido.large_file_url || elegido.file_url
                    };
                }
            } catch (e) { 
                console.log('Danbooru falló, intentando respaldo 1...'); 
            }

            // 2. Respaldo 1: Nekos.best (Súper estable y rápida)
            if (!post) {
                try {
                    const resNekos = await axios.get('https://nekos.best/api/v2/waifu', { timeout: 6000 });
                    const data = resNekos.data.results[0];
                    post = {
                        nombre: data.artist_name ? `Art by ${data.artist_name}` : 'Waifu Especial',
                        serie: 'Nekos.best / Anime',
                        imagen: data.url
                    };
                } catch (e) {
                    console.log('Nekos.best falló, intentando respaldo final...');
                }
            }

            // 3. Respaldo de emergencia total (Imagen fija o URL alternativa por si todo lo demás cae)
            if (!post) {
                post = {
                    nombre: 'Yuki Special',
                    serie: 'INKRA STUDIOS',
                    imagen: 'https://i.pinimg.com/736x/dd/6c/8c/dd6c8cf3d2574a79a9f1261c541866e9.jpg'
                };
            }

            const nombre = post.nombre.replace(/\b\w/g, l => l.toUpperCase());
            const serie = post.serie.replace(/\b\w/g, l => l.toUpperCase());
            const rareza = getRareza();

            // Descarga segura en Buffer
            const imgRes = await axios.get(post.imagen, { responseType: 'arraybuffer', timeout: 8000 });
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
                         `> 💡 Usa tu comando de claim para reclamarlo a tu harem.`
            }, { quoted: m });

        } catch (error) {
            console.error('Error crítico en roll.js:', error.message);
            await sock.sendMessage(jid, { text: `「✿」 Ups, ocurrió un error procesando el gacha. ¡Prueba de nuevo! 🌸` }, { quoted: m });
        }
    }
};
