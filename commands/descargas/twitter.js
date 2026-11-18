const { downloadWithYtDlp } = require('../../utils/mediaDownloader');

module.exports = {
    name: 'twitter',
    aliases: ['x', 'xdl', 'dlx', 'twdl', 'tw', 'twt'],
    category: 'downloads',
    description: 'Descarga un video o imagen de Twitter/X',

    async execute(sock, m, args, usedPrefix = '!') {
        const jid = m.key.remoteJid;
        const url = args[0]?.trim();

        if (!url || !/^https?:\/\//i.test(url)) {
            return sock.sendMessage(jid, {
                text: `「✿」 TWITTER / X DOWNLOADER 🐦\n\n` +
                      `₊˚ˑ༄ Envía un enlace válido de una publicación en Twitter/X.\n` +
                      `❀ *Ejemplo:* \`${usedPrefix}x https://x.com/...\``
            }, { quoted: m });
        }

        await sock.sendMessage(jid, {
            text: `「✿」 DESCARGANDO DE X / TWITTER 🌸\n\n` +
                  `₊˚ˑ༄ Procesando multimedia con yt-dlp...\n` +
                  `❀ _Espera un momento..._`
        }, { quoted: m });

        let media;
        try {
            media = await downloadWithYtDlp(url, { type: 'video', prefix: 'tw' });
            const isVideo = media.ext === 'mp4' || media.ext === 'webm' || media.ext === 'mov';

            if (isVideo) {
                await sock.sendMessage(jid, {
                    video: { url: media.filePath },
                    mimetype: 'video/mp4',
                    caption: `「✿」 X / TWITTER LISTO 🌸`
                }, { quoted: m });
            } else {
                await sock.sendMessage(jid, {
                    image: { url: media.filePath },
                    caption: `「✿」 X / TWITTER LISTO 🌸`
                }, { quoted: m });
            }
        } catch (err) {
            console.error('Error en twitter.js:', err.message);
            await sock.sendMessage(jid, {
                text: `「✿」 ERROR DE DESCARGA 🥀\n\n` +
                      `₊˚ˑ༄ No pude descargar el contenido de X / Twitter.`
            }, { quoted: m });
        } finally {
            if (media?.cleanup) media.cleanup();
        }
    }
};
