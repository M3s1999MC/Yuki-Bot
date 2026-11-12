module.exports = {
    name: 'pokecomida',
    category: 'gacha',
    description: 'Muestra la tienda de comida Pokémon con sus precios y niveles.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const text = `(「✿」 "TIENDA DE COMIDA POKÉMON"🌸)\n\n` +
                     `1. 🍪 *Galleta Básica* - ¥500 (+5 Nvl)\n` +
                     `2. 🍫 *Caramelo Raro* - ¥2,500 (+25 Nvl)\n` +
                     `3. 🍰 *PokéPochoclo Supremo* - ¥10,000 (+100 Nvl)\n\n` +
                     `💡 *Uso:* \`!pokefood <número> [cantidad]\``;

        await sock.sendMessage(jid, { text }, { quoted: m });
    }
};
