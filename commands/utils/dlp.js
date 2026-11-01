module.exports = {
    name: 'dlp',
    aliases: ['dlpa', 'dlpv', 'ytdlp', 'apidl'],
    category: 'tools',
    description: 'Prueba la descarga con yt-dlp por link o nombre.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const query = args.join(' ');

        if (!query) {
            return await sock.sendMessage(jid, { text: '⚠️ Por favor ingresa un enlace o término de búsqueda para yt-dlp.\n\n*Ejemplo:* `!dlp K-ON! opening`' }, { quoted: m });
        }

        await sock.sendMessage(jid, { text: `📥 Procesando descarga multimedia para: *${query}*...` }, { quoted: m });
    }
};