const { downloadMedia } = require('../../utils/mediaDownloader');

module.exports = {
    name: 'download',
    aliases: [],
    category: 'descargas',
    description: 'Descarga videos de TikTok, Instagram, Facebook o YouTube mediante un enlace.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const url = args[0];

        if (!url || !url.startsWith('http')) {
            return await sock.sendMessage(jid, { 
                text: '⚠️ Por favor, ingresa un enlace válido.\n_Ejemplo:_ `!tiktok https://vt.tiktok.com/...`' 
            }, { quoted: m });
        }

        try {
            await sock.sendMessage(jid, { text: '⏳ Descargando contenido, por favor espera un momento...' }, { quoted: m });
            const media = await downloadMedia(url);
            await sock.sendMessage(jid, {
                video: media.buffer,
                mimetype: media.mimetype,
                caption: '📥 Descarga completada.'
            }, { quoted: m });
        } catch (err) {
            console.error('❌ Error en el sistema de descargas:', err);
            await sock.sendMessage(jid, { text: `❌ No se pudo procesar la descarga. ${err.message}` }, { quoted: m });
        }
    }
};