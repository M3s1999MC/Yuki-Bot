const { isValidUrl, downloadWithYtDlp, formatCaption } = require('../../services/downloader');

module.exports = {
    name: 'tiktok',
    aliases: ['tt', 'tiktokdl'],
    category: 'downloads',
    description: 'Descarga videos de TikTok sin marca de agua.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const url = args.join(' ').trim();
        if (!isValidUrl(url)) {
            return sock.sendMessage(jid, {
                text: formatCaption('TIKTOK', ['✦ Uso: `!tiktok <enlace>`'])
            }, { quoted: m });
        }

        await sock.sendMessage(jid, { react: { text: '⬇️', key: m.key } });

        try {
            const buffer = await downloadWithYtDlp(url, { mode: 'mp4', maxDurationSec: 300 });
            await sock.sendMessage(jid, {
                video: buffer,
                mimetype: 'video/mp4',
                caption: formatCaption('TIKTOK', ['✦ _Video descargado sin marca de agua_'])
            }, { quoted: m });
        } catch (err) {
            console.error('[tiktok]', err?.message || err);
            await sock.sendMessage(jid, {
                text: formatCaption('TIKTOK', ['🍡 _No pude descargar ese TikTok._'])
            }, { quoted: m });
        }
    }
};
