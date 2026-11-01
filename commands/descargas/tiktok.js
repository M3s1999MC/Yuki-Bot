const { downloadMedia } = require('../../utils/mediaDownloader');

module.exports = {
    name: 'tiktok',
    aliases: ['tt', 'tiktokdl', 'ttdl'],
    category: 'downloads',
    description: 'Descarga un video de TikTok desde un enlace.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const url = args[0];

        let validUrl = false;
        try {
            const host = new URL(url).hostname.toLowerCase();
            validUrl = host === 'tiktok.com' || host.endsWith('.tiktok.com');
        } catch {}
        if (!validUrl) {
            return await sock.sendMessage(jid, { text: '⚠️ Por favor envía un enlace válido de TikTok.' }, { quoted: m });
        }

        await sock.sendMessage(jid, { text: '📥 Descargando video de TikTok...' }, { quoted: m });
        try {
            const media = await downloadMedia(url);
            await sock.sendMessage(jid, { video: media.buffer, mimetype: media.mimetype, caption: '📥 Descarga de TikTok completada.' }, { quoted: m });
        } catch (err) {
            console.error('Error descargando TikTok:', err.message);
            await sock.sendMessage(jid, { text: `❌ No se pudo descargar el enlace. ${err.message}` }, { quoted: m });
        }
    }
};