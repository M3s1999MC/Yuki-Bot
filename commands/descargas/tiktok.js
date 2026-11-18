const { sendMediaChoiceButtons } = require('../../utils/mediaDownloader');

module.exports = {
    name: 'tiktok',
    aliases: ['tt', 'tiktokdl', 'ttdl'],
    category: 'downloads',
    description: 'Prepara un enlace de TikTok y pregunta si deseas audio o video.',

    async execute(sock, m, args, usedPrefix = '!') {
        const jid = m.key.remoteJid;
        const url = args[0]?.trim();

        if (!url || !/^https?:\/\//i.test(url)) {
            return sock.sendMessage(jid, {
                text: `「✿」 TIKTOK DOWNLOADER 🎶\n\n` +
                      `₊˚ˑ༄ Envía un enlace válido de TikTok.\n` +
                      `❀ *Ejemplo:* \`${usedPrefix}tt https://vm.tiktok.com/...\``
            }, { quoted: m });
        }

        await sock.sendMessage(jid, {
            text: `「✿」 ENLACE DE TIKTOK LISTO 🌸\n\n` +
                  `₊˚ˑ༄ 🔗 ${url}`
        }, { quoted: m });

        await sendMediaChoiceButtons(sock, jid, m, {
            url,
            title: 'TikTok Media'
        });
    }
};
