module.exports = {
    name: 'orbe',
    aliases: ['comprarorbe'],
    category: 'gacha',
    description: 'Compra orbes por su número.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const num = args[0];
        const cant = parseInt(args[1]) || 1;

        if (!num) return sock.sendMessage(jid, { text: '(「✿」 "TIENDA DE ORBES"🌸)\n\n⚠️ Uso: `!orbe <número> [cantidad]`' }, { quoted: m });

        await sock.sendMessage(jid, {
            text: `(「✿」 "ORBE ADQUIRIDO"🌸)\n\n🔮 Compraste *${cant}x Orbe #${num}*.`
        }, { quoted: m });
    }
};
