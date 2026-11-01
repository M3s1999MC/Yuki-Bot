const { downloadMedia } = require('../../utils/mediaDownloader');

module.exports = {
    name: 'tiktokmp3',
    aliases: ['ttmp3', 'tiktokaudio'],
    category: 'downloads',
    description: 'Descarga el audio de un video de TikTok.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const url = args[0];

        let validUrl = false;
        try {
            const host = new URL(url).hostname.toLowerCase();
            validUrl = host === 'tiktok.com' || host.endsWith('.tiktok.com');
        } catch {}
        if (!validUrl) {
            return await sock.sendMessage(jid, { text: '⚠️ Por favor envía un enlace válido de TikTok para extraer su audio.' }, { quoted: m });
        }

        await sock.sendMessage(jid, { text: '🎵 Extrayendo audio desde TikTok...' }, { quoted: m });
        try {
            const media = await downloadMedia(url, { audio: true });
            await sock.sendMessage(jid, { audio: media.buffer, mimetype: media.mimetype, fileName: `${media.title || 'tiktok-audio'}${media.ext}`, ptt: false }, { quoted: m });
        } catch (err) {
            console.error('Error extrayendo audio de TikTok:', err.message);
            await sock.sendMessage(jid, { text: `❌ No se pudo extraer el audio. ${err.message}` }, { quoted: m });
        }
    }
};