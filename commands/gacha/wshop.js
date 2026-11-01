const db = require('../../database/db');

module.exports = {
    name: 'wshop',
    aliases: ['haremshop', 'tiendawaifus'],
    category: 'gacha',
    description: 'Muestra los personajes puestos en venta en el chat.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;

        db.all(`SELECT * FROM market`, async (err, rows) => {
            if (err || !rows || rows.length === 0) {
                return await sock.sendMessage(jid, { text: '🛒 No hay ningún personaje en venta en este momento.' }, { quoted: m });
            }

            let texto = `🛒 **TIENDA DE HAREMS (MERCADO)** 🛒\n\n`;
            rows.forEach((row, index) => {
                texto += `*${index + 1}.* **${row.character_name}** (${row.series})\n`;
                texto += `   💰 Precio: **$${row.price.toLocaleString()} coins**\n`;
                texto += `   👤 Vendedor: @${row.seller_jid.split('@')[0]}\n\n`;
            });
            texto += `> Usa \`!buychar [número o nombre]\` para comprar uno.`;

            let mentions = rows.map(r => r.seller_jid);
            await sock.sendMessage(jid, { text: texto, mentions }, { quoted: m });
        });
    }
};