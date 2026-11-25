const { isValidUrl, formatCaption, downloadWithYtDlp } = require('../../services/downloader');

function extractUrl(text) {
    const match = String(text || '').match(/https?:\/\/[^\s]+/i);
    return match ? match[0] : null;
}

module.exports = {
    name: 'instagram',
    aliases: ['ig', 'igdl', 'reel'],
    category: 'downloads',
    description: 'Descarga un video o reel público de Instagram.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const url = extractUrl(args.join(' ').trim());

        if (!url || !isValidUrl(url)) {
            return sock.sendMessage(jid, {
                text: formatCaption('INSTAGRAM', ['✦ Uso: `!instagram <enlace de Instagram>`'])
            }, { quoted: m });
        }

        await sock.sendMessage(jid, { react: { text: '📸', key: m.key } });

        try {
            const videoBuffer = await downloadWithYtDlp(url, { mode: 'mp4' });

            await sock.sendMessage(jid, {
                video: videoBuffer,
                mimetype: 'video/mp4',
                caption: formatCaption('INSTAGRAM', ['🍡 _Contenido descargado con éxito._'])
            }, { quoted: m });
        } catch (err) {
            console.error('[instagram]', err?.stderr || err?.message || err);
            await sock.sendMessage(jid, {
                text: formatCaption('INSTAGRAM', [
                    '🍡 _No pude descargar el contenido de Instagram._',
                    '✦ _Solo funciona con publicaciones o reels públicos._'
                ])
            }, { quoted: m });
        }
    }
};
