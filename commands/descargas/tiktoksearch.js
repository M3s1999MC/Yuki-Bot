const { runCommand } = require('../../utils/mediaDownloader');

module.exports = {
    name: 'tiktoksearch',
    aliases: ['ttsearch', 'ttbuscar'],
    category: 'downloads',
    description: 'Busca un video de TikTok por texto',

    async execute(sock, m, args, usedPrefix = '!') {
        const jid = m.key.remoteJid;
        const query = (args || []).join(' ').trim();

        if (!query) {
            return sock.sendMessage(jid, {
                text: `「✿」 TIKTOK SEARCH 🎵\n\n` +
                      `₊˚ˑ༄ Ingresa un término para buscar videos.\n` +
                      `❀ *Ejemplo:* \`${usedPrefix}tiktoksearch edits anime\``
            }, { quoted: m });
        }

        await sock.sendMessage(jid, {
            text: `「✿」 BUSCANDO EN TIKTOK 🌸\n\n` +
                  `₊˚ˑ༄ Búsqueda: *${query}*\n` +
                  `❀ _Consultando con yt-dlp..._`
        }, { quoted: m });

        try {
            const searchQuery = `tiktoksearch5:${query}`;
            const { stdout } = await runCommand('yt-dlp', [
                '--no-playlist',
                '--no-warnings',
                '--flat-playlist',
                '--print', '%(title)s ||| %(webpage_url)s',
                searchQuery
            ]);

            const lines = stdout
                .split('\n')
                .map(l => l.trim())
                .filter(Boolean)
                .slice(0, 5);

            if (!lines.length) {
                return sock.sendMessage(jid, {
                    text: `「✿」 SIN RESULTADOS 🥀\n\n` +
                          `₊˚ˑ༄ No encontré videos de TikTok para *${query}*.`
                }, { quoted: m });
            }

            const lista = lines.map((line, idx) => {
                const [title, url] = line.split('|||').map(s => s?.trim());
                return `❀ *${idx + 1}.* ${title || 'Video de TikTok'}\n   🔗 ${url || ''}`;
            }).join('\n\n');

            await sock.sendMessage(jid, {
                text: `「✿」 RESULTADOS DE TIKTOK 🌸\n\n` +
                      `₊˚ˑ༄ Búsqueda: *${query}*\n\n` +
                      `${lista}`
            }, { quoted: m });
        } catch (err) {
            console.error('Error en tiktoksearch.js:', err.message);
            await sock.sendMessage(jid, {
                text: `「✿」 ERROR DE BÚSQUEDA 🥀\n\n` +
                      `₊˚ˑ༄ No pude buscar en TikTok en este momento.`
            }, { quoted: m });
        }
    }
};
