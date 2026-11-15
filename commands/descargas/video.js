const ytdlp = require('yt-dlp-exec');

if (!global.yukiLastPlay) global.yukiLastPlay = new Map();
const lastPlay = global.yukiLastPlay;

module.exports = {
    name: 'video',
    category: 'downloader',
    description: 'Descarga en video la última canción buscada con !play.',
    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const data = lastPlay.get(jid);

        if (!data || !data.video) {
            return await sock.sendMessage(jid, { text: '「✿」 Primero busca algo con `!play`, por ejemplo: `!play Feid Luna`' }, { quoted: m });
        }

        const video = data.video;
        await sock.sendMessage(jid, { text: `「✿」 Descargando video de *${video.title}*... Esto puede tardar un poco.` }, { quoted: m });

        try {
            const videoUrl = await ytdlp(video.url, {
                getUrl: true,
                format: 'mp4[height<=360]/best[height<=360]/best',
                noPlaylist: true,
                noWarnings: true,
            });

            const cleanUrl = videoUrl.trim().split('\n')[0];
            const res = await fetch(cleanUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            if (!res.ok) throw new Error('Fetch fallo: ' + res.status);
            const buffer = Buffer.from(await res.arrayBuffer());

            console.log(`Video descargado: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);

            if (buffer.length > 16 * 1024 * 1024) {
                return await sock.sendMessage(jid, { text: '「✿」 El video pesa más de 16MB y WhatsApp no lo deja mandar. Intenta con `!audio`.' }, { quoted: m });
            }
            if (buffer.length < 1000) throw new Error('Video muy pequeño');

            await sock.sendMessage(jid, {
                video: buffer,
                mimetype: 'video/mp4',
                fileName: `${video.title}.mp4`,
                caption: `「✿」 Listo 🌸\n\n🎵 *${video.title}*`
            }, { quoted: m });

        } catch (e) {
            console.error('Error en !video:', e.message);
            await sock.sendMessage(jid, { text: '「✿」 No pude descargar el video, intenta con otro o en audio.' }, { quoted: m });
        }
    }
};
