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
    name: 'play',
    aliases: ['yta', 'ytmp3', 'song'],
    category: 'downloads',
    description: 'Descarga el audio en MP3 de un video de YouTube por búsqueda o enlace.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const input = args.join(' ').trim();
        if (!input) {
            return sock.sendMessage(jid, {
                text: formatCaption('YOUTUBE AUDIO', ['✦ Uso: `!play <nombre o enlace de YouTube>`'])
            }, { quoted: m });
        }

        await sock.sendMessage(jid, { react: { text: '🎵', key: m.key } });

        let targetUrl = extractYouTubeUrl(input);
        let title = 'Audio de YouTube';
        let duration = 'N/A';

        if (!targetUrl) {
            const results = await searchYouTube(input, 1);
            if (!results.length) {
                return sock.sendMessage(jid, {
                    text: formatCaption('YOUTUBE AUDIO', ['🍡 _No encontré resultados para tu búsqueda._'])
                }, { quoted: m });
            }
            targetUrl = results[0].url;
            title = results[0].title;
            duration = results[0].duration;
        }

        if (!isValidUrl(targetUrl)) {
            return sock.sendMessage(jid, {
                text: formatCaption('YOUTUBE AUDIO', ['🍡 _El enlace de YouTube no es válido._'])
            }, { quoted: m });
        }

        try {
            const audioBuffer = await downloadWithYtDlp(targetUrl, { mode: 'mp3' });

            await sock.sendMessage(jid, {
                text: formatCaption('YOUTUBE AUDIO', [
                    `✦ *Título:* ${title}`,
                    `✦ *Duración:* ${duration}`,
                    '🍡 _Enviando audio MP3..._'
                ])
            }, { quoted: m });

            await sock.sendMessage(jid, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                ptt: false
            }, { quoted: m });
        } catch (err) {
            console.error('[play]', err?.stderr || err?.message || err);
            await sock.sendMessage(jid, {
                text: formatCaption('YOUTUBE AUDIO', [
                    '🍡 _No pude descargar ese audio ahora mismo._',
                    '✦ _YouTube puede estar bloqueando peticiones desde el servidor._'
                ])
            }, { quoted: m });
        }
    }
};
