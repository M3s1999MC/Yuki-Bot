const yts = require('yt-search');

module.exports = {
    name: 'ytsearch',
    aliases: ['ytbuscar', 'yts'],
    category: 'downloads',
    description: 'Busca videos en YouTube por texto',

    async execute(sock, m, args, usedPrefix = '!') {
        const jid = m.key.remoteJid;
        const query = (args || []).join(' ').trim();

        if (!query) {
            return sock.sendMessage(jid, {
                text: `「✿」 YOUTUBE SEARCH 🔎\n\n` +
                      `₊˚ˑ༄ Escribe el nombre del video o canción a buscar.\n` +
                      `❀ *Ejemplo:* \`${usedPrefix}ytsearch el cuarteto de nos\``
            }, { quoted: m });
        }

        await sock.sendMessage(jid, {
            text: `「✿」 BUSCANDO EN YOUTUBE 🌸\n\n` +
                  `₊˚ˑ༄ Consulta: *${query}*\n` +
                  `❀ _Consultando resultados..._`
        }, { quoted: m });

        try {
            const res = await Promise.race([
                yts(query),
                new Promise((_, rej) => setTimeout(() => rej(new Error('timeout yts')), 15000))
            ]);

            const videos = (res?.videos || []).slice(0, 5);
            if (!videos.length) {
                return sock.sendMessage(jid, {
                    text: `「✿」 SIN RESULTADOS 🥀\n\n` +
                          `₊˚ˑ༄ No encontré videos para *${query}*.`
                }, { quoted: m });
            }

            const lista = videos.map((v, i) =>
                `❀ *${i + 1}.* ${v.title}\n` +
                `   ⏱️ ${v.timestamp || 'N/A'} | 👤 ${v.author?.name || 'Desconocido'}\n` +
                `   🔗 ${v.url}`
            ).join('\n\n');

            await sock.sendMessage(jid, {
                text: `「✿」 RESULTADOS DE YOUTUBE 🌸\n\n` +
                      `₊˚ˑ༄ Búsqueda: *${query}*\n\n` +
                      `${lista}`
            }, { quoted: m });
        } catch (err) {
            console.error('Error en ytsearch.js:', err.message);
            await sock.sendMessage(jid, {
                text: `「✿」 ERROR DE BÚSQUEDA 🥀\n\n` +
                      `₊˚ˑ༄ No pude completar la búsqueda en YouTube.`
            }, { quoted: m });
        }
    }
};
