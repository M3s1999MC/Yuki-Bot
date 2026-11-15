const ytdl = require('@distube/ytdl-core');

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
            const stream = ytdl(video.url, {
                filter: (format) => format.hasVideo && format.hasAudio,
                quality: 'lowestvideo',
                highWaterMark: 1 << 25
            });

            const chunks = [];
            for await (const chunk of stream) chunks.push(chunk);
            const buffer = Buffer.concat(chunks);

            await sock.sendMessage(jid, {
                video: buffer,
                mimetype: 'video/mp4',
                fileName: `${video.title}.mp4`,
                caption: `「✿」 Listo 🌸\n\n🎵 *${video.title}*`
            }, { quoted: m });

        } catch (e) {
            console.error('Error en !video:', e);
            await sock.sendMessage(jid, { text: '「✿」 No pude descargar el video, intenta con otro o en audio.' }, { quoted: m });
        }
    }
};
