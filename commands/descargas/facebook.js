const { downloadWithYtDlp } = require('../../utils/mediaDownloader');

module.exports = {
    name: 'facebook',
    aliases: ['fb', 'facebookdl', 'fbdl'],
    category: 'downloads',
    description: 'Descarga un video de Facebook',

    async execute(sock, m, args, usedPrefix = '!') {
        const jid = m.key.remoteJid;
        const url = args[0]?.trim();

        if (!url || !/^https?:\/\//i.test(url)) {
            return sock.sendMessage(jid, {
                text: `「✿」 FACEBOOK DOWNLOADER 📘\n\n` +
                      `₊˚ˑ༄ Envía un enlace válido de un video de Facebook.\n` +
                      `❀ *Ejemplo:* \`${usedPrefix}fb https://www.facebook.com/watch/?v=...\``
            }, { quoted: m });
        }

        await sock.sendMessage(jid, {
            text: `「✿」 DESCARGANDO DE FACEBOOK 🌸\n\n` +
                  `₊˚ˑ༄ Procesando video con yt-dlp...\n` +
                  `❀ _Espera un momento..._`
        }, { quoted: m });

        let media;
        try {
            media = await downloadWithYtDlp(url, { type: 'video', prefix: 'fb' });
            await sock.sendMessage(jid, {
                video: { url: media.filePath },
                mimetype: 'video/mp4',
                caption: `「✿」 FACEBOOK LISTO 🌸`
            }, { quoted: m });
        } catch (err) {
            console.error('Error en facebook.js:', err.message);
            await sock.sendMessage(jid, {
                text: `「✿」 ERROR DE DESCARGA 🥀\n\n` +
                      `₊˚ˑ༄ No pude descargar el video de Facebook.`
            }, { quoted: m });
        } finally {
            if (media?.cleanup) media.cleanup();
        }
    }
};
