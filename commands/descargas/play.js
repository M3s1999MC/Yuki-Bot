const { downloadMedia, searchYouTube, validateMediaUrl } = require('../../utils/mediaDownloader');
const { getMessageContent } = require('../../utils/messageContent');

module.exports = {
    name: 'play',
    aliases: ['yta', 'ytmp3', 'playdoc', 'play2', 'ytv', 'ytmp4', 'play2doc', 'playaudio', 'mp4'],
    category: 'downloads',
    description: 'Busca y descarga audio o video de YouTube.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const query = args.join(' ').trim();
        const content = getMessageContent(m.message);
        const body = content.conversation || content.extendedTextMessage?.text || content.imageMessage?.caption || '';
        const invokedAs = body.replace(/^!/, '').trim().split(/\s+/)[0].toLowerCase();
        const audio = ['yta', 'ytmp3', 'playaudio', 'play2', 'play2doc'].includes(invokedAs);

        if (!query) {
            return await sock.sendMessage(jid, { text: '⚠️ Por favor ingresa el nombre o enlace del video de YouTube que deseas descargar.\n\n*Ejemplo:* `!play El hijo de Hernández`' }, { quoted: m });
        }

        try {
            await sock.sendMessage(jid, { text: `📥 Procesando contenido de YouTube: *${query}*...` }, { quoted: m });
            let url;
            try { url = validateMediaUrl(query); } catch {
                const results = await searchYouTube(query);
                if (!results.length) return sock.sendMessage(jid, { text: '「✿」 No encontré resultados.' }, { quoted: m });
                url = results[0].url;
            }
            const media = await downloadMedia(url, { audio });
            if (audio) {
                await sock.sendMessage(jid, { audio: media.buffer, mimetype: media.mimetype, fileName: `${media.title || 'audio'}${media.ext}`, ptt: false }, { quoted: m });
            } else {
                await sock.sendMessage(jid, {
                    video: media.buffer,
                    mimetype: 'video/mp4',
                    fileName: `${media.title || 'youtube'}.mp4`,
                    caption: `🎬 ${media.title || 'Descarga de YouTube'}`
                }, { quoted: m });
            }
        } catch (err) {
            console.error('Error en !play:', err.message);
            await sock.sendMessage(jid, { text: `❌ No se pudo obtener el contenido. ${err.message}` }, { quoted: m });
        }
    }
};