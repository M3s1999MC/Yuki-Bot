const { sendMediaChoiceButtons } = require('../../utils/mediaDownloader');

module.exports = {
    name: 'facebook',
    aliases: ['fb', 'facebookdl', 'fbdl'],
    category: 'downloads',
    description: 'Prepara un enlace de Facebook y pregunta si deseas audio o video.',

    async execute(sock, m, args, usedPrefix = '!') {
        const jid = m.key.remoteJid;
        const url = args[0]?.trim();

        if (!url || !/^https?:\/\//i.test(url)) {
            return sock.sendMessage(jid, {
                text: `「✿」 FACEBOOK DOWNLOADER 📘\n\n` +
                      `₊˚ˑ༄ Envía un enlace válido de Facebook.\n` +
                      `❀ *Ejemplo:* \`${usedPrefix}fb https://www.facebook.com/watch/?v=...\``
            }, { quoted: m });
        }

        await sock.sendMessage(jid, {
            text: `「✿」 ENLACE DE FACEBOOK LISTO 🌸\n\n` +
                  `₊˚ˑ༄ 🔗 ${url}`
        }, { quoted: m });

        await sendMediaChoiceButtons(sock, jid, m, {
            url,
            title: 'Facebook Media'
        });
    }
};
