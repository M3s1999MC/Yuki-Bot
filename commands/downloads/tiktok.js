const { isValidUrl, formatCaption, downloadWithYtDlp } = require('../../services/downloader');

function extractUrl(text) {
    const match = String(text || '').match(/https?:\/\/[^\s]+/i);
    return match ? match[0] : null;
}

module.exports = {
    name: 'tiktok',
    aliases: ['tt', 'ttdl'],
    category: 'downloads',
    description: 'Descarga un video de TikTok en formato MP4.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const url = extractUrl(args.join(' ').trim());

        if (!url || !isValidUrl(url)) {
            return sock.sendMessage(jid, {
                text: formatCaption('TIKTOK VIDEO', ['✦ Uso: `!tiktok <enlace de TikTok>`'])
            }, { quoted: m });
        }

        await sock.sendMessage(jid, { react: { text: '🎵', key: m.key } });

        try {
            const videoBuffer = await downloadWithYtDlp(url, { mode: 'mp4' });

            await sock.sendMessage(jid, {
                video: videoBuffer,
                mimetype: 'video/mp4',
                caption: formatCaption('TIKTOK VIDEO', ['🍡 _Video descargado con éxito._'])
            }, { quoted: m });
        } catch (err) {
            console.error('[tiktok]', err?.stderr || err?.message || err);
            await sock.sendMessage(jid, {
                text: formatCaption('TIKTOK VIDEO', [
                    '🍡 _No pude descargar el video de TikTok._',
                    '✦ _Verifica que el enlace sea público y esté disponible._'
                ])
            }, { quoted: m });
        }
    }
};
