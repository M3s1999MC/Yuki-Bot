module.exports = {
    name: 'instagram',
    aliases: ['ig', 'igdl', 'instadl'],
    category: 'downloads',
    description: 'Descarga fotos o videos de Instagram',

    async execute(sock, m, args, usedPrefix = '!') {
        const jid = m.key.remoteJid;
        const url = args[0]?.trim();

        if (!url || !url.startsWith('http')) {
            return sock.sendMessage(jid, {
                text: `「✿」 INSTAGRAM DOWNLOADER 📸\n\n` +
                      `₊˚ˑ༄ Envía un enlace válido de una publicación o reel de Instagram.\n` +
                      `❀ *Ejemplo:* \`${usedPrefix}ig https://www.instagram.com/reel/...\``
            }, { quoted: m });
        }

        // TODO: Descargar foto/video de Instagram y enviarlo
        await sock.sendMessage(jid, {
            text: `「✿」 DESCARGANDO DE INSTAGRAM 🌸\n\n` +
                  `₊˚ˑ༄ Procesando contenido multimedia...\n` +
                  `❀ _Espera un momento..._`
        }, { quoted: m });
    }
};
