const { searchYouTube, formatCaption } = require('../../services/downloader');

module.exports = {
    name: 'ytsearch',
    aliases: ['ytbuscar', 'yts'],
    category: 'downloads',
    description: 'Busca videos en YouTube.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const query = args.join(' ').trim();
        if (!query) {
            return sock.sendMessage(jid, {
                text: formatCaption('BUSCAR EN YOUTUBE', ['✦ Uso: `!ytsearch <texto>`'])
            }, { quoted: m });
        }

        await sock.sendMessage(jid, { react: { text: '🎬', key: m.key } });
        const videos = await searchYouTube(query, 5);
        if (!videos.length) {
            return sock.sendMessage(jid, {
                text: formatCaption('BUSCAR EN YOUTUBE', ['🍡 _No encontré videos con ese nombre._'])
            }, { quoted: m });
        }

        const list = videos.map((v, i) => `${i + 1}. *${v.title}* [${v.duration}]\n   ${v.url}`);
        await sock.sendMessage(jid, {
            text: formatCaption('BUSCAR EN YOUTUBE', list)
        }, { quoted: m });
    }
};
