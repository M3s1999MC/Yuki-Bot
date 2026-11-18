module.exports = {
    name: 'facebook',
    aliases: ['fb', 'facebookdl', 'fbdl'],
    category: 'downloads',
    description: 'Descarga un video de Facebook',

    async execute(sock, m, args, usedPrefix = '!') {
        const jid = m.key.remoteJid;
        const url = args[0]?.trim();

        if (!url || !url.startsWith('http')) {
            return sock.sendMessage(jid, {
                text: `「✿」 FACEBOOK DOWNLOADER 📘\n\n` +
                      `₊˚ˑ༄ Envía un enlace válido de un video de Facebook.\n` +
                      `❀ *Ejemplo:* \`${usedPrefix}fb https://www.facebook.com/...\``
            }, { quoted: m });
        }

        // TODO: Descargar video de Facebook y enviarlo con sock.sendMessage
        await sock.sendMessage(jid, {
            text: `「✿」 DESCARGANDO DE FACEBOOK 🌸\n\n` +
                  `₊˚ˑ༄ Enlace recibido, procesando video...\n` +
                  `❀ _Espera un momento..._`
        }, { quoted: m });
    }
};
