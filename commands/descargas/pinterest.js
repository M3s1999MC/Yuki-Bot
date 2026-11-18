module.exports = {
    name: 'pinterest',
    aliases: ['pin', 'pinsearch'],
    category: 'downloads',
    description: 'Busca y envía una imagen de Pinterest con la búsqueda pública',

    async execute(sock, m, args, usedPrefix = '!') {
        const jid = m.key.remoteJid;
        const query = args.join(' ').trim();

        if (!query) {
            return sock.sendMessage(jid, {
                text: `「✿」 PINTEREST SEARCH 📌\n\n` +
                      `₊˚ˑ༄ Escribe qué imagen deseas buscar.\n` +
                      `❀ *Ejemplo:* \`${usedPrefix}pinterest estetica webcore\``
            }, { quoted: m });
        }

        // TODO: Implementar búsqueda pública en Pinterest y envío de imagen
        await sock.sendMessage(jid, {
            text: `「✿」 BUSCANDO EN PINTEREST 🌸\n\n` +
                  `₊˚ˑ༄ Consulta: *${query}*\n` +
                  `❀ _Módulo en preparación..._`
        }, { quoted: m });
    }
};
