const axios = require('axios');
const activeSpawns = require('../../utils/gachaSpawns');

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
    aliases: ['rw', 'rollwaifu', 'waifu', 'waifus', 'rollwaifus'],
    category: 'gacha',
    description: 'Tira un personaje de anime oficial al instante.',

    async execute(sock, m, args) {
        if (m.isProcessed) return;
        m.isProcessed = true;
        const jid = m.key.remoteJid;

        try {
            let post = null;

            // Consulta GraphQL a AniList API (Personajes y series oficiales de anime)
            try {
                const randomId = Math.floor(Math.random() * 2000) + 1;
                
                const query = `
                    query ($id: Int) {
                        Character (id: $id) {
                            name {
                                full
                            }
                            image {
                                large
                            }
                            media (perPage: 1) {
                                nodes {
                                    title {
                                        romaji
                                        english
                                    }
                                }
                            }
                        }
                    }
                `;

                const response = await axios.post('https://graphql.anilist.co', {
                    query: query,
                    variables: { id: randomId }
                }, { timeout: 7000 });

                const charData = response.data?.data?.Character;

                if (charData && charData.name?.full && charData.image?.large) {
                    let seriesName = 'Anime Original';
                    if (charData.media?.nodes && charData.media.nodes.length > 0) {
                        seriesName = charData.media.nodes[0].title.romaji || charData.media.nodes[0].title.english || 'Anime';
                    }

                    post = {
                        nombre: charData.name.full,
                        serie: seriesName,
                        imagen: charData.image.large
                    };
                }
            } catch (e) {
                console.log('AniList falló, usando respaldo con Nekos:', e.message);
            }

            // Respaldo por si AniList falla
            if (!post) {
                try {
                    const resNekos = await axios.get('https://nekos.best/api/v2/waifu', { timeout: 6000 });
                    const data = resNekos.data.results[0];
                    post = {
                        nombre: 'Waifu Sorpresa',
                        serie: 'Arte Anime',
                        imagen: data.url
                    };
                } catch (err) {
                    console.log('Respaldo secundario falló');
                }
            }

            // Respaldo de emergencia definitivo
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

            // Descarga segura de la imagen en Buffer para Baileys
            const imgRes = await axios.get(post.imagen, { responseType: 'arraybuffer', timeout: 8000 });
            const imageBuffer = Buffer.from(imgRes.data);

            // Enviamos el mensaje del gacha limpio y adaptado
            await sock.sendMessage(jid, {
                image: imageBuffer,
                caption: `🌸 *¡NUEVO PERSONAJE OBTENIDO!* 🌸\n\n` +
                         `• *Nombre:* ${nombre}\n` +
                         `• *Serie:* ${serie}\n` +
                         `• *Rareza:* ${rareza.emoji} *${rareza.nombre}*\n\n` +
                         `> 💡 ¡Responde a este mensaje con !claim para reclamarlo!`
            }, { quoted: m });

            // Guardamos el spawn en memoria para que cualquiera en el chat pueda reclamarlo
            activeSpawns.set(jid, {
                name: nombre,
                serie: serie,
                image_url: post.imagen,
                price: rareza.nombre === 'Mítica' ? 500 : rareza.nombre === 'Legendaria' ? 300 : 100
            });

        } catch (error) {
            console.error('Error crítico en roll.js:', error.message);
            await sock.sendMessage(jid, { text: `「✿」 Ups, ocurrió un error obteniendo el personaje. ¡Prueba de nuevo! 🌸` }, { quoted: m });
        }
    }
};
