module.exports = {
    name: 'ytsearch',
    aliases: ['ytbuscar', 'yts'],
    category: 'downloads',
    description: 'Busca videos en YouTube por texto',

    async execute(sock, m, args, usedPrefix = '!') {
        const jid = m.key.remoteJid;
        const query = args.join(' ').trim();

        if (!query) {
            return sock.sendMessage(jid, {
                text: `「✿」 YOUTUBE SEARCH 🔎\n\n` +
                      `₊˚ˑ༄ Escribe el nombre del video o canción a buscar.\n` +
                      `❀ *Ejemplo:* \`${usedPrefix}ytsearch el cuarteto de nos\``
            }, { quoted: m });
        }

        // TODO: Implementar búsqueda en YouTube y listar resultados
        await sock.sendMessage(jid, {
            text: `「✿」 BUSCANDO EN YOUTUBE 🌸\n\n` +
                  `₊˚ˑ༄ Búsqueda: *${query}*\n` +
                  `❀ _Preparando resultados..._`
        }, { quoted: m });
    }
};
