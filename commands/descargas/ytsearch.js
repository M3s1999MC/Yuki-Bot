const yts = require('yt-search');
const { sendMediaChoiceButtons } = require('../../utils/mediaDownloader');

module.exports = {
    name: 'ytsearch',
    aliases: ['ytbuscar', 'yts'],
    category: 'downloads',
    description: 'Busca un video en YouTube y muestra su portada, detalles y botones de descarga.',

    async execute(sock, m, args, usedPrefix = '!') {
        const jid = m.key.remoteJid;
        const query = (args || []).join(' ').trim();

        if (!query) {
            return sock.sendMessage(jid, {
                text: `「✿」 YOUTUBE SEARCH 🔎\n\n` +
                      `₊˚ˑ༄ Escribe qué video deseas buscar.\n` +
                      `❀ *Ejemplo:* \`${usedPrefix}ytsearch el gobierno gobierna\``
            }, { quoted: m });
        }

        await sock.sendMessage(jid, {
            text: `「✿」 Buscando en YouTube...`
        }, { quoted: m });

        try {
            const res = await Promise.race([
                yts(query),
                new Promise((_, rej) => setTimeout(() => rej(new Error('timeout yts')), 15000))
            ]);

            const videos = res?.videos || [];
            if (!videos.length) {
                return sock.sendMessage(jid, {
                    text: `「✿」 SIN RESULTADOS 🥀\n\n` +
                          `₊˚ˑ༄ No encontré nada para *${query}*.`
                }, { quoted: m });
            }

            const video = videos[0];

            // Formato limpio con portada, título, descripción y autor
            const caption = 
                `「✿」 RESULTADO DE YOUTUBE 🌸\n\n` +
                `🎵 *Título:* ${video.title}\n` +
                `👤 *Canal:* ${video.author?.name || 'Desconocido'}\n` +
                `⏱️ *Duración:* ${video.timestamp || 'N/A'} | 👀 *Vistas:* ${video.views?.toLocaleString() || 'N/A'}\n` +
                `📝 *Descripción:* ${video.description ? video.description.slice(0, 150) + '...' : 'Sin descripción'}\n` +
                `🔗 *Enlace:* ${video.url}`;

            try {
                await sock.sendMessage(jid, {
                    image: { url: video.thumbnail },
                    caption: caption
                }, { quoted: m });
            } catch (e) {
                console.error('Error enviando miniatura en ytsearch:', e.message);
                await sock.sendMessage(jid, { text: caption }, { quoted: m });
            }

            // Enviar botones interactivos de Audio y Video (igual que !play)
            await sendMediaChoiceButtons(sock, jid, m, {
                url: video.url,
                title: video.title
            }, '¿Qué deseas hacer con este video?');

        } catch (err) {
            console.error('Error en ytsearch.js:', err.message);
            await sock.sendMessage(jid, {
                text: `「✿」 ERROR DE BÚSQUEDA 🥀\n\n` +
                      `₊˚ˑ༄ Ocurrió un error al buscar en YouTube.`
            }, { quoted: m });
        }
    }
};
