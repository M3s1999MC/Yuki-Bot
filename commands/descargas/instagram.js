const { sendMediaChoiceButtons } = require('../../utils/mediaDownloader');

module.exports = {
    name: 'instagram',
    aliases: ['ig', 'igdl', 'instadl'],
    category: 'downloads',
    description: 'Prepara un enlace de Instagram y pregunta si deseas audio o video.',

    async execute(sock, m, args, usedPrefix = '!') {
        const jid = m.key.remoteJid;
        const url = args[0]?.trim();

        if (!url || !/^https?:\/\//i.test(url)) {
            return sock.sendMessage(jid, {
                text: `「✿」 INSTAGRAM DOWNLOADER 📸\n\n` +
                      `₊˚ˑ༄ Envía un enlace válido de Instagram.\n` +
                      `❀ *Ejemplo:* \`${usedPrefix}ig https://www.instagram.com/reel/...\``
            }, { quoted: m });
        }

        await sock.sendMessage(jid, {
            text: `「✿」 ENLACE DE INSTAGRAM LISTO 🌸\n\n` +
                  `₊˚ˑ༄ 🔗 ${url}`
        }, { quoted: m });

        await sendMediaChoiceButtons(sock, jid, m, {
            url,
            title: 'Instagram Media'
        });
    }
};
