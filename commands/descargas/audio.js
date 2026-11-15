const ytdl = require('@distube/ytdl-core');

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
            const stream = ytdl(video.url, {
                filter: 'audioonly',
                quality: 'highestaudio',
                highWaterMark: 1 << 25
            });

            const chunks = [];
            for await (const chunk of stream) chunks.push(chunk);
            const buffer = Buffer.concat(chunks);

            await sock.sendMessage(jid, {
                audio: buffer,
                mimetype: 'audio/mp4',
                fileName: `${video.title}.mp3`,
                ptt: false
            }, { quoted: m });

        } catch (e) {
            console.error('Error en !audio:', e);
            await sock.sendMessage(jid, { text: '「✿」 No pude descargar el audio, intenta de nuevo.' }, { quoted: m });
        }
    }
};
