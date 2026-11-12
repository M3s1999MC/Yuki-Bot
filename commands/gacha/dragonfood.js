module.exports = {
    name: 'dragonfood',
    category: 'gacha',
    description: 'Muestra la tienda de comida para dragones.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const text = `(「✿」 "TIENDA DE DRAGONES"🌸)\n\n` +
                     `1. 🥩 *Carne Jugosa* - ¥800\n` +
                     `2. 🍉 *Fruta Dragón Dorada* - ¥6,000\n\n` +
                     `💡 *Uso:* \`!dragoncomprar <número> [cantidad]\``;

        await sock.sendMessage(jid, { text }, { quoted: m });
    }
};
