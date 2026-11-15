const ytdlp = require('yt-dlp-exec');

if (!global.yukiLastPlay) global.yukiLastPlay = new Map();
const lastPlay = global.yukiLastPlay;

module.exports = {
    name: 'audio',
    category: 'downloader',
    description: 'Descarga en audio la última canción buscada con !play.',
    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const data = lastPlay.get(jid);

        if (!data || !data.video) {
            return await sock.sendMessage(jid, { text: '「✿」 Primero busca algo con `!play`, por ejemplo: `!play Feid Luna`' }, { quoted: m });
        }

        const video = data.video;
        await sock.sendMessage(jid, { text: `「✿」 Descargando audio de *${video.title}*...` }, { quoted: m });

        try {
            // 1. Pedirle a yt-dlp la URL directa del mejor audio
            const audioUrl = await ytdlp(video.url, {
                getUrl: true,
                format: 'bestaudio[ext=m4a]/bestaudio/best',
                noPlaylist: true,
                noWarnings: true,
            });

            const cleanUrl = audioUrl.trim().split('\n')[0];
            console.log('Audio URL:', cleanUrl.slice(0, 100));

            // 2. Descargar ese audio
            const res = await fetch(cleanUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            if (!res.ok) throw new Error('Fetch fallo: ' + res.status);
            const arrayBuffer = await res.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            console.log(`Audio descargado: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);

            if (buffer.length < 1000) throw new Error('Audio muy pequeño');

            await sock.sendMessage(jid, {
                audio: buffer,
                mimetype: 'audio/mpeg',
                fileName: `${video.title}.mp3`
            }, { quoted: m });

        } catch (e) {
            console.error('Error en !audio:', e.message);
            await sock.sendMessage(jid, { text: '「✿」 No pude descargar el audio, intenta de nuevo.' }, { quoted: m });
        }
    }
};
