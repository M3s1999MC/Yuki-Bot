module.exports = {
    name: 'tiktoksearch',
    aliases: ['ttsearch', 'ttbuscar'],
    category: 'downloads',
    description: 'Busca un video de TikTok por texto (requiere TIKTOK_SEARCH_API_URL)',

    async execute(sock, m, args, usedPrefix = '!') {
        const jid = m.key.remoteJid;
        const query = args.join(' ').trim();
        const apiUrl = process.env.TIKTOK_SEARCH_API_URL;

        if (!query) {
            return sock.sendMessage(jid, {
                text: `「✿」 TIKTOK SEARCH 🎵\n\n` +
                      `₊˚ˑ༄ Ingresa un término para buscar videos.\n` +
                      `❀ *Ejemplo:* \`${usedPrefix}tiktoksearch edits anime\``
            }, { quoted: m });
        }

        if (!apiUrl) {
            return sock.sendMessage(jid, {
                text: `「✿」 CONFIGURACIÓN FALTANTE ⚠️\n\n` +
                      `₊˚ˑ༄ Falta configurar \`TIKTOK_SEARCH_API_URL\` en el entorno.`
            }, { quoted: m });
        }

        // TODO: Consultar apiUrl con query y enviar el resultado
        await sock.sendMessage(jid, {
            text: `「✿」 BUSCANDO EN TIKTOK 🌸\n\n` +
                  `₊˚ˑ༄ Búsqueda: *${query}*\n` +
                  `❀ _Conectando con el servicio..._`
        }, { quoted: m });
    }
};
