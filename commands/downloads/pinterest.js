const { searchPinterest, formatCaption } = require('../../services/downloader');

module.exports = {
    name: 'pinterest',
    aliases: ['pin', 'pinsearch'],
    category: 'downloads',
    description: 'Busca imágenes en Pinterest.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const query = args.join(' ').trim();
        if (!query) {
            return sock.sendMessage(jid, {
                text: formatCaption('PINTEREST', ['✦ Uso: `!pinterest <búsqueda>`'])
            }, { quoted: m });
        }

        await sock.sendMessage(jid, { react: { text: '📌', key: m.key } });
        const pins = await searchPinterest(query, 4);
        if (!pins.length) {
            return sock.sendMessage(jid, {
                text: formatCaption('PINTEREST', ['🍡 _No encontré pines con esa búsqueda._'])
            }, { quoted: m });
        }

        const first = pins[0];
        await sock.sendMessage(jid, {
            image: { url: first.imageUrl },
            caption: formatCaption('PINTEREST', [
                `✦ *Resultado:* ${first.title}`,
                first.pinUrl ? `✦ *Enlace:* ${first.pinUrl}` : null
            ])
        }, { quoted: m });
    }
};
