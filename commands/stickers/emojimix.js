module.exports = {
    name: 'emojimix',
    alias: ['mix'],
    desc: 'Fusiona dos emojis en un nuevo sticker',
    run: async (sock, m, args) => {
        if (!args[0] || !args[1]) return sock.sendMessage(m.key.remoteJid, { text: '⚠️ Envía dos emojis. Ejemplo: `!emojimix 😎 🔥`' }, { quoted: m });
        await sock.sendMessage(m.key.remoteJid, { text: `✨ Mezclando ${args[0]} + ${args[1]}... (Generando mezcla de emojis)` }, { quoted: m });
    }
};
