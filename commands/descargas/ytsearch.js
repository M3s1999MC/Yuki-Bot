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
            text: `「✿」 BUSCANDO EN YOUTUBE 🌸\n\n` +
                  `₊˚ˑ༄ Consulta: *${query}*\n` +
                  `❀ _Consultando resultados..._`
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
            const descLimpia = video.description
                ? `${video.description.replace(/\s+/g, ' ').trim().slice(0, 140)}...`
                : 'Sin descripción disponible.';

            const caption =
                `「✿」 RESULTADO DE YOUTUBE 🌸\n\n` +
                `❀ *Título:*\n` +
                `│ ${video.title}\n` +
                `❀ *Canal:*\n` +
                `│ ${video.author?.name || 'Desconocido'}\n` +
                `❀ *Duración:*\n` +
                `│ ${video.timestamp || 'N/A'}\n` +
                `❀ *Vistas:*\n` +
                `│ ${Number(video.views || 0).toLocaleString('es-CO')}\n` +
                `❀ *Descripción:*\n` +
                `│ ${descLimpia}\n` +
                `❀ *Enlace:*\n` +
                `│ ${video.url}\n` +
                `───────────────────\n` +
                `₊˚ˑ༄ Selecciona el formato que prefieras`;

            try {
                await sock.sendMessage(jid, {
                    image: { url: video.thumbnail },
                    caption
                }, { quoted: m });
            } catch (e) {
                console.error('Error enviando miniatura en ytsearch:', e.message);
                await sock.sendMessage(jid, { text: caption }, { quoted: m });
            }

            await sendMediaChoiceButtons(sock, jid, m, {
                url: video.url,
                title: video.title
            }, '「✿」 Elige el formato de descarga 🌸');

        } catch (err) {
            console.error('Error en ytsearch.js:', err.message);
            await sock.sendMessage(jid, {
                text: `「✿」 ERROR DE BÚSQUEDA 🥀\n\n` +
                      `₊˚ˑ༄ No pude completar la búsqueda en YouTube.`
            }, { quoted: m });
        }
    }
};
