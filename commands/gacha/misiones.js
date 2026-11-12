module.exports = {
    name: 'misiones',
    aliases: ['misionesgacha', 'quests'],
    category: 'gacha',
    description: 'Muestra tus misiones diarias del gacha y cobra recompensas.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const text = `(「✿」 "MISIONES DIARIAS GACHA"🌸)\n\n` +
                     `1. ⚡ Realiza 3 tiradas en Pokémon (2/3)\n` +
                     `2. ⚔️ Gana 1 combate PvP (0/1)\n\n` +
                     `💡 Escribe \`!misiones cobrar\` para reclamar.`;

        await sock.sendMessage(jid, { text }, { quoted: m });
    }
};
