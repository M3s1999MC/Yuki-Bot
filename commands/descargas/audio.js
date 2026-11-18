const { downloadWithYtDlp } = require('../../utils/mediaDownloader');

module.exports = {
    name: 'audio',
    aliases: ['ytaudio', 'mp3'],
    category: 'downloads',
    description: 'Descarga el audio MP3 del último enlace o búsqueda enviada.',

    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const saved = global.yukiLastPlay?.get(jid);
        const url = saved?.url || saved?.video?.url;
        const title = saved?.title || saved?.video?.title || 'Audio descargado';

        if (!url) {
            return sock.sendMessage(jid, {
                text: `「✿」 SIN ENLACE GUARDADO 🥀\n\n` +
                      `₊˚ˑ༄ Primero usa \`!play\`, \`!tiktok\`, \`!ig\`, \`!fb\` o \`!x\`.`
            }, { quoted: m });
        }

        await sock.sendMessage(jid, {
            text: `「✿」 EXTRAYENDO AUDIO MP3 🎧🌸\n\n` +
                  `₊˚ˑ༄ *${title}*\n` +
                  `❀ _Convirtiendo con yt-dlp y FFmpeg..._`
        }, { quoted: m });

        let media;
        try {
            media = await downloadWithYtDlp(url, { type: 'audio', prefix: 'btn_audio' });
            await sock.sendMessage(jid, {
                audio: { url: media.filePath },
                mimetype: 'audio/mpeg',
                ptt: false
            }, { quoted: m });
        } catch (err) {
            console.error('Error en audio.js:', err.message);
            await sock.sendMessage(jid, {
                text: `「✿」 ERROR AL EXTRAER AUDIO 🥀\n\n` +
                      `₊˚ˑ༄ No pude convertir este enlace a MP3.`
            }, { quoted: m });
        } finally {
            if (media?.cleanup) media.cleanup();
        }
    }
};
