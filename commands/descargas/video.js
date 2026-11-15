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
            // 18 = 360p MP4 con video + audio juntos, es el que menos falla
            let stream;
            try {
                stream = ytdl(video.url, {
                    quality: '18',
                    highWaterMark: 1 << 25,
                    requestOptions: {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                        }
                    }
                });
            } catch (e) {
                console.log('Fallo calidad 18, intento con audioandvideo');
                stream = ytdl(video.url, {
                    filter: 'audioandvideo',
                    quality: 'lowest',
                    highWaterMark: 1 << 25
                });
            }

            const chunks = [];
            for await (const chunk of stream) chunks.push(chunk);
            const buffer = Buffer.concat(chunks);

            console.log(`Video descargado: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);

            // WhatsApp no deja mandar videos de más de 16MB como video normal
            if (buffer.length > 16 * 1024 * 1024) {
                return await sock.sendMessage(jid, { text: '「✿」 El video pesa más de 16MB y WhatsApp no lo deja mandar como video. Intenta con `!audio`.' }, { quoted: m });
            }

            if (buffer.length < 1000) {
                throw new Error('Buffer muy pequeño, descarga fallida');
            }

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
