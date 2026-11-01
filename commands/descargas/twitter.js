const { downloadMedia } = require('../../utils/mediaDownloader');

module.exports = {
    name: 'twitter',
    aliases: ['x', 'xdl', 'dlx', 'twdl', 'tw', 'twt'],
    category: 'downloads',
    description: 'Descarga un video o imagen de Twitter/X.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const url = args[0];

        let validUrl = false;
        try { validUrl = /(^|\.)twitter\.com$|(^|\.)x\.com$/i.test(new URL(url).hostname); } catch {}
        if (!validUrl) {
            return await sock.sendMessage(jid, { text: '⚠️ Por favor envía un enlace válido de Twitter/X.' }, { quoted: m });
        }

        await sock.sendMessage(jid, { text: '📥 Descargando multimedia de Twitter/X...' }, { quoted: m });
        try {
            const media = await downloadMedia(url);
            await sock.sendMessage(jid, { video: media.buffer, mimetype: media.mimetype, caption: '📥 Descarga de X completada.' }, { quoted: m });
        } catch (err) {
            console.error('Error descargando X:', err.message);
            await sock.sendMessage(jid, { text: `❌ No se pudo descargar el enlace. ${err.message}` }, { quoted: m });
        }
    }
};