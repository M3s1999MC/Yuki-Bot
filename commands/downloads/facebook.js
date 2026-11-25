const { isValidUrl, downloadWithYtDlp, formatCaption } = require('../../services/downloader');

module.exports = {
    name: 'facebook',
    aliases: ['fb', 'facebookdl'],
    category: 'downloads',
    description: 'Descarga videos o reels públicos de Facebook.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const url = args.join(' ').trim();
        if (!isValidUrl(url)) {
            return sock.sendMessage(jid, {
                text: formatCaption('FACEBOOK', ['✦ Uso: `!facebook <enlace>`'])
            }, { quoted: m });
        }

        await sock.sendMessage(jid, { react: { text: '⬇️', key: m.key } });

        try {
            const buffer = await downloadWithYtDlp(url, { mode: 'mp4', maxDurationSec: 300 });
            await sock.sendMessage(jid, {
                video: buffer,
                mimetype: 'video/mp4',
                caption: formatCaption('FACEBOOK', ['✦ _Video de Facebook listo_'])
            }, { quoted: m });
        } catch (err) {
            console.error('[facebook]', err?.message || err);
            await sock.sendMessage(jid, {
                text: formatCaption('FACEBOOK', ['🍡 _No pude descargar ese video (revisa que sea público)._'])
            }, { quoted: m });
        }
    }
};
