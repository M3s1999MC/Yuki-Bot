module.exports = {
    name: 'poketop',
    aliases: ['pokemontop'],
    category: 'gacha',
    description: 'Muestra a las personas con más Pokémon en todo el bot.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const text = `(「✿」 "TOP COLECCIÓN POKÉMON"🌸)\n\n` +
                     `1. @Usuario1 — 142 Pokémon\n` +
                     `2. @Usuario2 — 118 Pokémon\n` +
                     `3. @Usuario3 — 95 Pokémon`;

        await sock.sendMessage(jid, { text }, { quoted: m });
    }
};
