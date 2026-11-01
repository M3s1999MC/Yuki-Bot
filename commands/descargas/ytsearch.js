const { searchYouTube } = require('../../utils/mediaDownloader');

module.exports = {
    name: 'ytsearch',
    aliases: ['ytbuscar', 'yts'],
    category: 'downloads',
    description: 'Busca videos en YouTube por texto.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const query = args.join(' ');

        if (!query) {
            return await sock.sendMessage(jid, { text: '⚠️ Por favor ingresa qué deseas buscar en YouTube.\n\n*Ejemplo:* `!ytsearch El Cuarteto de Nos`' }, { quoted: m });
        }

        await sock.sendMessage(jid, { text: `🔍 Buscando videos en YouTube para: *${query}*...` }, { quoted: m });
        try {
            const results = await searchYouTube(query);
            if (!results.length) return sock.sendMessage(jid, { text: '「✿」 No encontré resultados.' }, { quoted: m });
            const text = results.map((item, index) =>
                `${index + 1}. *${item.title}*\n⏱️ ${item.duration} · 👁️ ${item.views}\n${item.url}`
            ).join('\n\n');
            await sock.sendMessage(jid, { text: `「✿」 Resultados de YouTube 🌸\n\n${text}\n\nUsa !download <URL> para descargar un video.` }, { quoted: m });
        } catch (err) {
            console.error('Error buscando en YouTube:', err.message);
            await sock.sendMessage(jid, { text: '❌ No se pudo completar la búsqueda de YouTube.' }, { quoted: m });
        }
    }
};