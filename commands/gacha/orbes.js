module.exports = {
    name: 'orbes',
    aliases: ['snakeorbes'],
    category: 'gacha',
    description: 'Muestra la tienda de orbes para alimentar Snakes.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const text = `(「✿」 "TIENDA DE ORBES - SNAKE"🌸)\n\n` +
                     `1. 🔮 *Orbe Menor* - ¥600 (+10 Nvl)\n` +
                     `2. 🌀 *Orbe Místico* - ¥3,000 (+50 Nvl)\n\n` +
                     `💡 *Uso:* \`!orbe <número> [cantidad]\``;

        await sock.sendMessage(jid, { text }, { quoted: m });
    }
};
