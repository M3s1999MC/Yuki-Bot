const { searchYouTube, formatCaption } = require('../../services/downloader');

module.exports = {
    name: 'tiktoksearch',
    aliases: ['ttsearch'],
    category: 'downloads',
    description: 'Busca clips y tendencias de TikTok.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const query = args.join(' ').trim();
        if (!query) {
            return sock.sendMessage(jid, {
                text: formatCaption('BUSCAR EN TIKTOK', ['✦ Uso: `!tiktoksearch <búsqueda>`'])
            }, { quoted: m });
        }

        await sock.sendMessage(jid, { react: { text: '🔎', key: m.key } });
        const items = await searchYouTube(`${query} tiktok`, 5);
        if (!items.length) {
            return sock.sendMessage(jid, {
                text: formatCaption('BUSCAR EN TIKTOK', ['🍡 _No hallé resultados para esa búsqueda._'])
            }, { quoted: m });
        }

        const list = items.map((v, i) => `${i + 1}. *${v.title}* (${v.duration})\n   ${v.url}`);
        await sock.sendMessage(jid, {
            text: formatCaption('BUSCAR EN TIKTOK', list)
        }, { quoted: m });
    }
};
