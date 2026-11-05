module.exports = {
    name: 'emojimix',
    aliases: ['mix'],
    description: 'Fusiona dos emojis en un nuevo sticker',
    async execute(sock, m, args) {
        if (!args[0] || !args[1]) return sock.sendMessage(m.key.remoteJid, { text: '⚠️ Envía dos emojis. Ejemplo: `!emojimix 😎 🔥`' }, { quoted: m });
        await sock.sendMessage(m.key.remoteJid, { text: `✨ Mezclando ${args[0]} + ${args[1]}... (Generando mezcla de emojis)` }, { quoted: m });
    }
};
