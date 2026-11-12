module.exports = {
    name: 'codtienda',
    category: 'gacha',
    description: 'Muestra la tienda de artículos para Call of Duty.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const text = `(「✿」 "TIENDA CALL OF DUTY"🌸)\n\n` +
                     `1. 🪖 *Placas Blindadas* - ¥1,200\n` +
                     `2. 🎯 *Mira Láser Táctica* - ¥4,500\n\n` +
                     `💡 *Uso:* \`!codcomprar <número> [cantidad]\``;

        await sock.sendMessage(jid, { text }, { quoted: m });
    }
};
