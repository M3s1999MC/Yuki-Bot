module.exports = {
    name: 'market_legacy',
    aliases: [],
    category: 'gacha',
    description: 'Gestiona la venta y compra de personajes en el chat.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const caption = `🛒 **Mercado de Personajes (Gacha)**\n\n` +
                        `No hay personajes en venta actualmente en este chat.\n` +
                        `_Usa !sell <personaje> <precio> para poner uno en venta._`;

        await sock.sendMessage(jid, { text: caption }, { quoted: m });
    }
};