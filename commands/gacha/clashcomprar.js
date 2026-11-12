module.exports = {
    name: 'clashcomprar',
    category: 'gacha',
    description: 'Compra artículos de la tienda de Clash Royale.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const num = args[0];
        const cant = parseInt(args[1]) || 1;

        if (!num) return sock.sendMessage(jid, { text: '(「✿」 "TIENDA CLASH"🌸)\n\n⚠️ Uso: `!clashcomprar <número> [cantidad]`' }, { quoted: m });

        await sock.sendMessage(jid, {
            text: `(「✿」 "COMPRA CLASH EXITOSA"🌸)\n\n📜 Adquiriste *${cant}x Comodín #${num}*.`
        }, { quoted: m });
    }
};
