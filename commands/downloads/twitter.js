const { isValidUrl, downloadWithYtDlp, formatCaption } = require('../../services/downloader');

module.exports = {
    name: 'twitter',
    aliases: ['x', 'xdl'],
    category: 'downloads',
    description: 'Descarga videos públicos de X (Twitter).',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const url = args.join(' ').trim();
        if (!isValidUrl(url)) {
            return sock.sendMessage(jid, {
                text: formatCaption('X / TWITTER', ['✦ Uso: `!twitter <enlace>`'])
            }, { quoted: m });
        }

        await sock.sendMessage(jid, { react: { text: '⬇️', key: m.key } });

        try {
            const buffer = await downloadWithYtDlp(url, { mode: 'mp4', maxDurationSec: 300 });
            await sock.sendMessage(jid, {
                video: buffer,
                mimetype: 'video/mp4',
                caption: formatCaption('X / TWITTER', ['✦ _Video de X descargado_'])
            }, { quoted: m });
        } catch (err) {
            console.error('[twitter]', err?.message || err);
            await sock.sendMessage(jid, {
                text: formatCaption('X / TWITTER', ['🍡 _No pude descargar ese video de X._'])
            }, { quoted: m });
        }
    }
};
