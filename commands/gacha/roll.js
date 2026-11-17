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
    description: 'Tira una ilustración de anime al instante.',

    async execute(sock, m, args) {
        if (m.isProcessed) return;
        m.isProcessed = true;
        const jid = m.key.remoteJid;

        try {
            let post = null;

            // Consumo directo y exclusivo de Nekos.best
            try {
                const resNekos = await axios.get('https://nekos.best/api/v2/waifu', { timeout: 7000 });
                const data = resNekos.data.results[0];
                
                let artist = data.artist_name ? data.artist_name.replace(/\*/g, '').trim() : 'Desconocido';

                post = {
                    nombre: `Ilustración de ${artist}`,
                    serie: 'Arte Anime Original',
                    imagen: data.url
                };
            } catch (e) {
                console.log('Error conectando con Nekos.best:', e.message);
            }

            // Respaldo de emergencia por si la API llega a parpadear
            if (!post) {
                post = {
                    nombre: 'Yuki Special Edition',
                    serie: 'INKRA STUDIOS',
                    imagen: 'https://i.pinimg.com/736x/dd/6c/8c/dd6c8cf3d2574a79a9f1261c541866e9.jpg'
                };
            }

            const nombre = String(post.nombre).replace(/[\*_`]/g, '').trim();
            const serie = String(post.serie).replace(/[\*_`]/g, '').trim();
            const rareza = getRareza();

            // Descarga segura en Buffer para Baileys
            const imgRes = await axios.get(post.imagen, { responseType: 'arraybuffer', timeout: 8000 });
            const imageBuffer = Buffer.from(imgRes.data);

            await sock.sendMessage(jid, {
                image: imageBuffer,
                caption: `╭━━━ 𝖄𝖚𝖐𝖎'𝖘 𝕲𝖆𝖈𝖍𝖆 ━━━╮\n` +
                         `┃ 🌸 *¡NUEVO PERSONAJE OBTENIDO!*\n` +
                         `┣━━━━━━━━━━━━━━━━━━\n` +
                         `┃ • *Nombre:* ${nombre}\n` +
                         `┃ • *Serie:* ${serie}\n` +
                         `┃ • *Rareza:* ${rareza.emoji} *${rareza.nombre}*\n` +
                         `╰━━━━━━━━━━━━━━━━━━╯\n\n` +
                         `> 💡 Usa tu comando de claim para reclamarlo a tu harem.`
            }, { quoted: m });

        } catch (error) {
            console.error('Error crítico en roll.js:', error.message);
            await sock.sendMessage(jid, { text: `「✿」 Ups, ocurrió un error obteniendo la ilustración. ¡Prueba de nuevo! 🌸` }, { quoted: m });
        }
    }
};
