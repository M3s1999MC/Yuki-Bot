const { downloadWithYtDlp } = require('../../utils/mediaDownloader');

module.exports = {
    name: 'video',
    aliases: ['ytvideo'],
    category: 'downloads',
    description: 'Descarga el video MP4 del último enlace o búsqueda enviada.',

    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const saved = global.yukiLastPlay?.get(jid);
        const url = saved?.url || saved?.video?.url;
        const title = saved?.title || saved?.video?.title || 'Video descargado';

        if (!url) {
            return sock.sendMessage(jid, {
                text: `「✿」 SIN ENLACE GUARDADO 🥀\n\n` +
                      `₊˚ˑ༄ Primero usa \`!play\`, \`!tiktok\`, \`!ig\`, \`!fb\` o \`!x\`.`
            }, { quoted: m });
        }

        await sock.sendMessage(jid, {
            text: `「✿」 DESCARGANDO VIDEO MP4 📹🌸\n\n` +
                  `₊˚ˑ༄ *${title}*\n` +
                  `❀ _Procesando con yt-dlp..._`
        }, { quoted: m });

        let media;
        try {
            media = await downloadWithYtDlp(url, { type: 'video', prefix: 'btn_video' });
            await sock.sendMessage(jid, {
                video: { url: media.filePath },
                mimetype: 'video/mp4',
                caption: `「✿」 *${title}* 🌸`
            }, { quoted: m });
        } catch (err) {
            console.error('Error en video.js:', err.message);
            await sock.sendMessage(jid, {
                text: `「✿」 ERROR AL DESCARGAR VIDEO 🥀\n\n` +
                      `₊˚ˑ༄ No pude procesar el video de este enlace.`
            }, { quoted: m });
        } finally {
            if (media?.cleanup) media.cleanup();
        }
    }
};
