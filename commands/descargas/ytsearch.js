const yts = require('yt-search');
const { sendMediaChoiceButtons } = require('../../utils/mediaDownloader');

module.exports = {
    name: 'ytsearch',
    aliases: ['ytbuscar', 'yts'],
    category: 'downloads',
    description: 'Busca un video en YouTube con estilo limpio de símbolos y botones de descarga.',

    async execute(sock, m, args, usedPrefix = '!') {
        const jid = m.key.remoteJid;
        const query = (args || []).join(' ').trim();

        if (!query) {
            return sock.sendMessage(jid, {
                text: `「✿」 *YOUTUBE SEARCH*\n\n` +
                      `˚୨•(✿)• ⊹ Uso del comando\n` +
                      `▸ Escribe qué video deseas buscar.\n` +
                      `› Ejemplo: \`${usedPrefix}yts el gobierno gobierna\``
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
                    text: `「✿」 *SIN RESULTADOS*\n\n` +
                          `˚୨•(✿)• ⊹ Búsqueda\n` +
                          `▸ No se encontró nada para *${query}*.`
                }, { quoted: m });
            }

            const video = videos[0];
            const descLimpia = video.description
                ? `${video.description.replace(/\s+/g, ' ').trim().slice(0, 120)}...`
                : 'Sin descripción disponible.';

            const caption =
                `「✿」 *YOUTUBE RESULT* ✦\n\n` +
                `*${video.title}*\n\n` +
                `˚୨•(✿)• ⊹ Detalles\n` +
                `▸ Canal: \`${video.author?.name || 'Desconocido'}\`\n` +
                `▸ Duración: \`${video.timestamp || 'N/A'}\` • Vistas: \`${Number(video.views || 0).toLocaleString('es-CO')}\`\n\n` +
                `› _"${descLimpia}"_\n\n` +
                `▸ Enlace: \`${video.url}\``;

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
            }, '「✿」 Elige el formato • Audio / Video');

        } catch (err) {
            console.error('Error en ytsearch.js:', err.message);
            await sock.sendMessage(jid, {
                text: `「✿」 *ERROR DE BÚSQUEDA*\n\n` +
                      `˚୨•(✿)• ⊹ Estado\n` +
                      `▸ Ocurrió un problema al consultar YouTube.`
            }, { quoted: m });
        }
    }
};
