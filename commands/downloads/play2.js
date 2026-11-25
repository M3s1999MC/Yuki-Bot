const {
    isValidUrl,
    formatCaption,
    searchYouTube,
    downloadWithYtDlp
} = require('../../services/downloader');

function extractYouTubeUrl(text) {
    const match = String(text || '').match(/(https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/watch\?[^\s]+|youtu\.be\/[^\s]+))/i);
    return match ? match[1] : null;
}

module.exports = {
    name: 'play2',
    aliases: ['ytv', 'ytmp4', 'video'],
    category: 'downloads',
    description: 'Descarga el video en MP4 de YouTube por búsqueda o enlace.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const input = args.join(' ').trim();
        if (!input) {
            return sock.sendMessage(jid, {
                text: formatCaption('YOUTUBE VIDEO', ['✦ Uso: `!play2 <nombre o enlace de YouTube>`'])
            }, { quoted: m });
        }

        await sock.sendMessage(jid, { react: { text: '🎬', key: m.key } });

        let targetUrl = extractYouTubeUrl(input);
        let title = 'Video de YouTube';
        let duration = 'N/A';

        if (!targetUrl) {
            const results = await searchYouTube(input, 1);
            if (!results.length) {
                return sock.sendMessage(jid, {
                    text: formatCaption('YOUTUBE VIDEO', ['🍡 _No encontré resultados para tu búsqueda._'])
                }, { quoted: m });
            }
            targetUrl = results[0].url;
            title = results[0].title;
            duration = results[0].duration;
        }

        if (!isValidUrl(targetUrl)) {
            return sock.sendMessage(jid, {
                text: formatCaption('YOUTUBE VIDEO', ['🍡 _El enlace de YouTube no es válido._'])
            }, { quoted: m });
        }

        try {
            const videoBuffer = await downloadWithYtDlp(targetUrl, { mode: 'mp4' });

            await sock.sendMessage(jid, {
                video: videoBuffer,
                mimetype: 'video/mp4',
                caption: formatCaption('YOUTUBE VIDEO', [
                    `✦ *Título:* ${title}`,
                    `✦ *Duración:* ${duration}`
                ])
            }, { quoted: m });
        } catch (err) {
            console.error('[play2]', err?.stderr || err?.message || err);
            await sock.sendMessage(jid, {
                text: formatCaption('YOUTUBE VIDEO', [
                    '🍡 _No pude descargar ese video ahora mismo._',
                    '✦ _YouTube puede estar bloqueando peticiones desde el servidor._'
                ])
            }, { quoted: m });
        }
    }
};
