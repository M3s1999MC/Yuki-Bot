const { downloadWithYtDlp } = require('../../utils/mediaDownloader');

module.exports = {
    name: 'instagram',
    aliases: ['ig', 'igdl', 'instadl'],
    category: 'downloads',
    description: 'Descarga fotos o videos de Instagram',

    async execute(sock, m, args, usedPrefix = '!') {
        const jid = m.key.remoteJid;
        const url = args[0]?.trim();

        if (!url || !/^https?:\/\//i.test(url)) {
            return sock.sendMessage(jid, {
                text: `「✿」 INSTAGRAM DOWNLOADER 📸\n\n` +
                      `₊˚ˑ༄ Envía un enlace válido de una publicación o reel de Instagram.\n` +
                      `❀ *Ejemplo:* \`${usedPrefix}ig https://www.instagram.com/reel/...\``
            }, { quoted: m });
        }

        await sock.sendMessage(jid, {
            text: `「✿」 DESCARGANDO DE INSTAGRAM 🌸\n\n` +
                  `₊˚ˑ༄ Procesando multimedia con yt-dlp...\n` +
                  `❀ _Espera un momento..._`
        }, { quoted: m });

        let media;
        try {
            media = await downloadWithYtDlp(url, { type: 'video', prefix: 'ig' });
            const isVideo = media.ext === 'mp4' || media.ext === 'webm' || media.ext === 'mov';

            if (isVideo) {
                await sock.sendMessage(jid, {
                    video: { url: media.filePath },
                    mimetype: 'video/mp4',
                    caption: `「✿」 INSTAGRAM LISTO 🌸`
                }, { quoted: m });
            } else {
                await sock.sendMessage(jid, {
                    image: { url: media.filePath },
                    caption: `「✿」 INSTAGRAM LISTO 🌸`
                }, { quoted: m });
            }
        } catch (err) {
            console.error('Error en instagram.js:', err.message);
            await sock.sendMessage(jid, {
                text: `「✿」 ERROR DE DESCARGA 🥀\n\n` +
                      `₊˚ˑ༄ No pude descargar el contenido de Instagram.`
            }, { quoted: m });
        } finally {
            if (media?.cleanup) media.cleanup();
        }
    }
};
