const { downloadMedia } = require('../../utils/mediaDownloader');

module.exports = {
    name: 'facebook',
    aliases: ['fb', 'facebookdl', 'fbdl'],
    category: 'downloads',
    description: 'Descarga un video de Facebook.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const url = args[0];

        let validUrl = false;
        try {
            const host = new URL(url).hostname.toLowerCase();
            validUrl = ['facebook.com', 'fb.watch'].some(domain => host === domain || host.endsWith(`.${domain}`));
        } catch {}
        if (!validUrl) {
            return await sock.sendMessage(jid, { text: '⚠️ Por favor envía un enlace válido de Facebook.' }, { quoted: m });
        }

        await sock.sendMessage(jid, { text: '📥 Descargando video de Facebook...' }, { quoted: m });
        try {
            const media = await downloadMedia(url);
            await sock.sendMessage(jid, { video: media.buffer, mimetype: media.mimetype, caption: '📥 Descarga de Facebook completada.' }, { quoted: m });
        } catch (err) {
            console.error('Error descargando Facebook:', err.message);
            await sock.sendMessage(jid, { text: `❌ No se pudo descargar el enlace. ${err.message}` }, { quoted: m });
        }
    }
};