const { isValidUrl, formatCaption, downloadWithYtDlp } = require('../../services/downloader');

function extractUrl(text) {
    const match = String(text || '').match(/https?:\/\/[^\s]+/i);
    return match ? match[0] : null;
}

module.exports = {
    name: 'facebook',
    aliases: ['fb', 'fbdl'],
    category: 'downloads',
    description: 'Descarga un video público de Facebook en MP4.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const url = extractUrl(args.join(' ').trim());

        if (!url || !isValidUrl(url)) {
            return sock.sendMessage(jid, {
                text: formatCaption('FACEBOOK VIDEO', ['✦ Uso: `!facebook <enlace de Facebook>`'])
            }, { quoted: m });
        }

        await sock.sendMessage(jid, { react: { text: '📘', key: m.key } });

        try {
            const videoBuffer = await downloadWithYtDlp(url, { mode: 'mp4' });

            await sock.sendMessage(jid, {
                video: videoBuffer,
                mimetype: 'video/mp4',
                caption: formatCaption('FACEBOOK VIDEO', ['🍡 _Video descargado con éxito._'])
            }, { quoted: m });
        } catch (err) {
            console.error('[facebook]', err?.stderr || err?.message || err);
            await sock.sendMessage(jid, {
                text: formatCaption('FACEBOOK VIDEO', [
                    '🍡 _No pude descargar el video de Facebook._',
                    '✦ _Asegúrate de que el video sea público._'
                ])
            }, { quoted: m });
        }
    }
};
