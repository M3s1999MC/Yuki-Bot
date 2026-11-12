module.exports = {
    name: 'pokefood',
    aliases: ['pokecomprar'],
    category: 'gacha',
    description: 'Compra comida Pokémon por su número.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const num = args[0];
        const cant = parseInt(args[1]) || 1;

        if (!num) return sock.sendMessage(jid, { text: '(「✿」 "TIENDA POKÉMON"🌸)\n\n⚠️ Indica el número del artículo: `!pokefood <número> [cantidad]`' }, { quoted: m });

        await sock.sendMessage(jid, {
            text: `(「✿」 "COMPRA REALIZADA"🌸)\n\n🍪 Adquiriste *${cant}x Artículo #${num}* de comida Pokémon.`
        }, { quoted: m });
    }
};
