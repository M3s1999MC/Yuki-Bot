const { isValidUrl, downloadWithYtDlp, formatCaption } = require('../../services/downloader');

module.exports = {
    name: 'instagram',
    aliases: ['ig', 'igdl'],
    category: 'downloads',
    description: 'Descarga reels o videos públicos de Instagram.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const url = args.join(' ').trim();
        if (!isValidUrl(url)) {
            return sock.sendMessage(jid, {
                text: formatCaption('INSTAGRAM', ['✦ Uso: `!instagram <enlace>`'])
            }, { quoted: m });
        }

        await sock.sendMessage(jid, { react: { text: '⬇️', key: m.key } });

        try {
            const buffer = await downloadWithYtDlp(url, { mode: 'mp4', maxDurationSec: 300 });
            await sock.sendMessage(jid, {
                video: buffer,
                mimetype: 'video/mp4',
                caption: formatCaption('INSTAGRAM', ['✦ _Reel/Video de Instagram listo_'])
            }, { quoted: m });
        } catch (err) {
            console.error('[instagram]', err?.message || err);
            await sock.sendMessage(jid, {
                text: formatCaption('INSTAGRAM', ['🍡 _No pude descargar ese enlace de Instagram._'])
            }, { quoted: m });
        }
    }
};
