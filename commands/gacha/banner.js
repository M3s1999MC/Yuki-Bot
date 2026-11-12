module.exports = {
    name: 'banner',
    aliases: ['destacados', 'semanal_gacha'],
    category: 'gacha',
    description: 'Muestra los personajes destacados de la semana y tu garantía.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;

        const text = `(「✿」 "BANNER SEMANAL"🌸)\n\n` +
                     `🌟 *Personajes Destacados:*\n` +
                     `• Mewtwo (Pokémon) - Tasa aumentada x3\n` +
                     `• Megacaballero (Clash Royale)\n\n` +
                     `🎯 *Garantía (Pity):* 45 / 90 tiradas para SSR asegurado.`;

        await sock.sendMessage(jid, { text }, { quoted: m });
    }
};
