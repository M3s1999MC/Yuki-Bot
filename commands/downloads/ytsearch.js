const { getYouTubeVideoDetails, formatCaption } = require('../../services/downloader');

function shortenText(text, maxLen = 260) {
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    if (!clean) return 'Sin descripción disponible.';
    return clean.length > maxLen ? `${clean.slice(0, maxLen).trim()}...` : clean;
}

module.exports = {
    name: 'ytsearch',
    aliases: ['ytbuscar', 'yts'],
    category: 'downloads',
    description: 'Muestra un video de YouTube por búsqueda o enlace con su portada, detalles y cómo descargar.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const query = args.join(' ').trim();
        if (!query) {
            return sock.sendMessage(jid, {
                text: formatCaption('YOUTUBE SEARCH', [
                    '✦ _Puedes buscar por nombre o pegar un enlace de YouTube._',
                    '✦ *Uso:* `!ytsearch <nombre o enlace>`'
                ])
            }, { quoted: m });
        }

        await sock.sendMessage(jid, { react: { text: '🎬', key: m.key } });

        const video = await getYouTubeVideoDetails(query);
        if (!video) {
            return sock.sendMessage(jid, {
                text: formatCaption('YOUTUBE SEARCH', ['🍡 _No encontré ese video en YouTube._'])
            }, { quoted: m });
        }

        const caption = formatCaption('YOUTUBE SEARCH', [
            `✦ *Nombre:* ${video.title}`,
            `✦ *Canal:* ${video.channel}`,
            `✦ *Likes:* ${video.likes}`,
            `✦ *Descripción:* ${shortenText(video.description, 240)}`,
            `✦ *Enlace:* ${video.url}`,
            '━━━━━━━━━━ 🌸 ━━━━━━━━━━',
            '🍡 *Descargar:*',
            '• _Audio (MP3):_ `!play <nombre o enlace>`',
            '• _Video (MP4):_ `!play2 <nombre o enlace>`'
        ]);

        if (video.thumbnail) {
            await sock.sendMessage(jid, {
                image: { url: video.thumbnail },
                caption
            }, { quoted: m });
        } else {
            await sock.sendMessage(jid, { text: caption }, { quoted: m });
        }
    }
};
