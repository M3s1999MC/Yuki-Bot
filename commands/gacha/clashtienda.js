module.exports = {
    name: 'clashtienda',
    category: 'gacha',
    description: 'Muestra la tienda de artículos para Clash Royale.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const text = `(「✿」 "TIENDA CLASH ROYALE"🌸)\n\n` +
                     `1. 📜 *Comodín Común* - ¥1,000\n` +
                     `2. ⚡ *Comodín Épico* - ¥5,000\n\n` +
                     `💡 *Uso:* \`!clashcomprar <número> [cantidad]\``;

        await sock.sendMessage(jid, { text }, { quoted: m });
    }
};
