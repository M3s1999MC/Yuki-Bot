const { downloadMedia } = require('../../utils/mediaDownloader');

module.exports = {
    name: 'instagram',
    aliases: ['ig', 'igdl', 'instadl'],
    category: 'downloads',
    description: 'Descarga fotos o videos de Instagram.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const url = args[0];

        let validUrl = false;
        try {
            const host = new URL(url).hostname.toLowerCase();
            validUrl = host === 'instagram.com' || host.endsWith('.instagram.com');
        } catch {}
        if (!validUrl) {
            return await sock.sendMessage(jid, { text: '⚠️ Por favor envía un enlace válido de Instagram (reel, post o historia).' }, { quoted: m });
        }

        await sock.sendMessage(jid, { text: '📥 Descargando contenido de Instagram...' }, { quoted: m });
        try {
            const media = await downloadMedia(url);
            await sock.sendMessage(jid, { video: media.buffer, mimetype: media.mimetype, caption: '📥 Descarga de Instagram completada.' }, { quoted: m });
        } catch (err) {
            console.error('Error descargando Instagram:', err.message);
            await sock.sendMessage(jid, { text: `❌ No se pudo descargar el enlace. ${err.message}` }, { quoted: m });
        }
    }
};