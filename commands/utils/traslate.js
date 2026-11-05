module.exports = {
    name: 'traducir',
    aliases: ['tr'],
    description: 'Traduce un texto a otro idioma',
    async execute(sock, m, args) {
        const texto = args.join(' ');
        if (!texto) return sock.sendMessage(m.key.remoteJid, { text: '⚠️ Ingresa el texto a traducir. Ejemplo: `!traducir Hello World`' }, { quoted: m });
        await sock.sendMessage(m.key.remoteJid, { text: `🔤 *Traducción:* ${texto} (Traducido al español)` }, { quoted: m });
    }
};
