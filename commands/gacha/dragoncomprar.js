module.exports = {
    name: 'dragoncomprar',
    category: 'gacha',
    description: 'Compra comida para dragones.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const num = args[0];
        const cant = parseInt(args[1]) || 1;

        if (!num) return sock.sendMessage(jid, { text: '(「✿」 "TIENDA DRAGONES"🌸)\n\n⚠️ Uso: `!dragoncomprar <número> [cantidad]`' }, { quoted: m });

        await sock.sendMessage(jid, {
            text: `(「✿」 "ALIMENTO COMPRADO"🌸)\n\n🥩 Adquiriste *${cant}x Alimento #${num}*.`
        }, { quoted: m });
    }
};
