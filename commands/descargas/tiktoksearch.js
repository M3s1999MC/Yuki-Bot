const { searchTikTok } = require('../../utils/mediaDownloader');

module.exports = {
    name: 'tiktoksearch',
    aliases: ['ttsearch', 'ttbuscar'],
    category: 'downloads',
    description: 'Busca un video de TikTok por texto.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const query = args.join(' ');

        if (!query) {
            return await sock.sendMessage(jid, { text: '⚠️ Por favor ingresa los términos de búsqueda para TikTok.' }, { quoted: m });
        }

        try {
            const results = await searchTikTok(query);
            if (!results.length) return sock.sendMessage(jid, { text: '「✿」 No encontré resultados para esa búsqueda.' }, { quoted: m });
            const text = results.map((item, index) => `${index + 1}. *${item.title}*\n${item.url}`).join('\n\n');
            await sock.sendMessage(jid, { text: `「✿」 Resultados de TikTok 🌸\n\n${text}\n\nUsa !tiktok <URL> para descargar un video.` }, { quoted: m });
        } catch (err) {
            console.error('Error buscando en TikTok:', err.message);
            await sock.sendMessage(jid, { text: `❌ ${err.message}` }, { quoted: m });
        }
    }
};