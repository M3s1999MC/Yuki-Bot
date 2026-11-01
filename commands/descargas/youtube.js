const yts = require('yt-search');
const { downloadMedia, validateMediaUrl } = require('../../utils/mediaDownloader');

module.exports = {
    name: 'youtube',
    aliases: [],
    category: 'descargas',
    description: 'Descarga audio o video de YouTube por búsqueda o enlace.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const text = args.join(' ').trim();

        if (!text) {
            return await sock.sendMessage(jid, { text: '⚠️ Por favor, ingresa el nombre de la canción o el enlace de YouTube.' }, { quoted: m });
        }

        await sock.sendMessage(jid, { text: '🔍 Procesando contenido de YouTube...' }, { quoted: m });

        try {
            let downloadUrl;
            try { downloadUrl = validateMediaUrl(text); } catch {
                const search = await yts(text);
                if (!search.videos.length) return await sock.sendMessage(jid, { text: '❌ No se encontraron resultados.' }, { quoted: m });
                downloadUrl = search.videos[0].url;
            }
            const media = await downloadMedia(downloadUrl);
            await sock.sendMessage(jid, { video: media.buffer, mimetype: media.mimetype, caption: `🎬 ${media.title || 'YouTube'}` }, { quoted: m });
        } catch (err) {
            console.error(err);
            await sock.sendMessage(jid, { text: `❌ No se pudo descargar el contenido. ${err.message}` }, { quoted: m });
        }
    }
};