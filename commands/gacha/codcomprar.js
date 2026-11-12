module.exports = {
    name: 'codcomprar',
    category: 'gacha',
    description: 'Compra artículos de la tienda de Call of Duty.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const num = args[0];
        const cant = parseInt(args[1]) || 1;

        if (!num) return sock.sendMessage(jid, { text: '(「✿」 "TIENDA COD"🌸)\n\n⚠️ Uso: `!codcomprar <número> [cantidad]`' }, { quoted: m });

        await sock.sendMessage(jid, {
            text: `(「✿」 "SUMINISTRO COMPRADO"🌸)\n\n🪖 Adquiriste *${cant}x Mejora #${num}*.`
        }, { quoted: m });
    }
};
