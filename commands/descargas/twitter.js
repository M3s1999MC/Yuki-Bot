const { sendMediaChoiceButtons } = require('../../utils/mediaDownloader');

module.exports = {
    name: 'twitter',
    aliases: ['x', 'xdl', 'dlx', 'twdl', 'tw', 'twt'],
    category: 'downloads',
    description: 'Prepara un enlace de Twitter/X y pregunta si deseas audio o video.',

    async execute(sock, m, args, usedPrefix = '!') {
        const jid = m.key.remoteJid;
        const url = args[0]?.trim();

        if (!url || !/^https?:\/\//i.test(url)) {
            return sock.sendMessage(jid, {
                text: `「✿」 TWITTER / X DOWNLOADER 🐦\n\n` +
                      `₊˚ˑ༄ Envía un enlace válido de Twitter/X.\n` +
                      `❀ *Ejemplo:* \`${usedPrefix}x https://x.com/...\``
            }, { quoted: m });
        }

        await sock.sendMessage(jid, {
            text: `「✿」 ENLACE DE X / TWITTER LISTO 🌸\n\n` +
                  `₊˚ˑ༄ 🔗 ${url}`
        }, { quoted: m });

        await sendMediaChoiceButtons(sock, jid, m, {
            url,
            title: 'Twitter/X Media'
        });
    }
};
