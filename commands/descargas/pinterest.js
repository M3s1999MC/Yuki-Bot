const { runCommand, tempDir } = require('../../utils/mediaDownloader');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'pinterest',
    aliases: ['pin', 'pinsearch'],
    category: 'downloads',
    description: 'Busca y envía una imagen de Pinterest con la búsqueda pública',

    async execute(sock, m, args, usedPrefix = '!') {
        const jid = m.key.remoteJid;
        const query = (args || []).join(' ').trim();

        if (!query) {
            return sock.sendMessage(jid, {
                text: `「✿」 PINTEREST SEARCH 📌\n\n` +
                      `₊˚ˑ༄ Escribe qué imagen deseas buscar.\n` +
                      `❀ *Ejemplo:* \`${usedPrefix}pinterest estetica webcore\``
            }, { quoted: m });
        }

        await sock.sendMessage(jid, {
            text: `「✿」 BUSCANDO EN PINTEREST 🌸\n\n` +
                  `₊˚ˑ༄ Consulta: *${query}*\n` +
                  `❀ _Buscando imagen con yt-dlp..._`
        }, { quoted: m });

        const id = `pin_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const outTemplate = path.join(tempDir, `${id}.%(ext)s`);

        try {
            await runCommand('yt-dlp', [
                '--no-playlist',
                '--no-warnings',
                '-o', outTemplate,
                `ytsearch1:pinterest ${query}`
            ]).catch(async () => {
                await runCommand('yt-dlp', [
                    '--no-playlist',
                    '--no-warnings',
                    '--flat-playlist',
                    '--print', 'url',
                    `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`
                ]);
            });

            const files = fs.readdirSync(tempDir).filter(f => f.startsWith(id));
            if (files.length) {
                const filePath = path.join(tempDir, files[0]);
                const ext = path.extname(filePath).toLowerCase();
                try {
                    if (['.mp4', '.webm', '.mov'].includes(ext)) {
                        await sock.sendMessage(jid, {
                            video: { url: filePath },
                            mimetype: 'video/mp4',
                            caption: `「✿」 PINTEREST: *${query}* 🌸`
                        }, { quoted: m });
                    } else {
                        await sock.sendMessage(jid, {
                            image: { url: filePath },
                            caption: `「✿」 PINTEREST: *${query}* 🌸`
                        }, { quoted: m });
                    }
                } finally {
                    try { fs.unlinkSync(filePath); } catch (_) {}
                }
                return;
            }

            const searchUrl = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`;
            await sock.sendMessage(jid, {
                text: `「✿」 PINTEREST 🌸\n\n` +
                      `₊˚ˑ༄ Búsqueda pública: *${query}*\n` +
                      `❀ 🔗 ${searchUrl}`
            }, { quoted: m });
        } catch (err) {
            console.error('Error en pinterest.js:', err.message);
            await sock.sendMessage(jid, {
                text: `「✿」 ERROR EN PINTEREST 🥀\n\n` +
                      `₊˚ˑ༄ No pude obtener resultados para *${query}*.`
            }, { quoted: m });
        }
    }
};
