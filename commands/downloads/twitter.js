const { isValidUrl, formatCaption, downloadWithYtDlp } = require('../../services/downloader');

function extractUrl(text) {
    const match = String(text || '').match(/https?:\/\/[^\s]+/i);
    return match ? match[0] : null;
}

module.exports = {
    name: 'twitter',
    aliases: ['x', 'xdl', 'tw'],
    category: 'downloads',
    description: 'Descarga un video de X (Twitter) en formato MP4.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const url = extractUrl(args.join(' ').trim());

        if (!url || !isValidUrl(url)) {
            return sock.sendMessage(jid, {
                text: formatCaption('X / TWITTER', ['✦ Uso: `!twitter <enlace de X o Twitter>`'])
            }, { quoted: m });
        }

        await sock.sendMessage(jid, { react: { text: '🐦', key: m.key } });

        try {
            const videoBuffer = await downloadWithYtDlp(url, { mode: 'mp4' });

            await sock.sendMessage(jid, {
                video: videoBuffer,
                mimetype: 'video/mp4',
                caption: formatCaption('X / TWITTER', ['🍡 _Video descargado con éxito._'])
            }, { quoted: m });
        } catch (err) {
            console.error('[twitter]', err?.stderr || err?.message || err);
            await sock.sendMessage(jid, {
                text: formatCaption('X / TWITTER', [
                    '🍡 _No pude descargar el video de X/Twitter._',
                    '✦ _Verifica que el post contenga un video público._'
                ])
            }, { quoted: m });
        }
    }
};
