const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

const catalog = [
    '⚫ Carbón — 50% · $150',
    '⚙️ Hierro — 30% · $350',
    '🟡 Oro — 15% · $800',
    '💎 Diamante — 5% · $2,000'
];

module.exports = {
    name: 'minerales',
    aliases: ['mochila', 'inventario', 'ores'],
    category: 'economy',
    description: 'Muestra los minerales que tienes o el catálogo de probabilidades.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        if ((args[0] || '').toLowerCase() === 'catalogo') {
            return sock.sendMessage(jid, { text: `「✿」 Catálogo de minerales ⛏️\n\n${catalog.join('\n')}` }, { quoted: m });
        }

        db.all(`SELECT mineral, quantity FROM user_minerals WHERE user_jid = ? ORDER BY mineral`, [sender], (err, rows) => {
            if (err) {
                console.error('Error al consultar inventario minero:', err.message);
                return sock.sendMessage(jid, { text: '「✿」 No pude consultar tu inventario.' }, { quoted: m });
            }
            const text = rows.length
                ? `「✿」 Tu mochila de minerales 🎒\n\n${rows.map(row => `• ${row.mineral}: *${row.quantity}*`).join('\n')}\n\n_Usa !venderminerales para vender._`
                : '「✿」 Tu mochila está vacía. Usa !minar para encontrar minerales.';
            sock.sendMessage(jid, { text }, { quoted: m });
        });
    }
};
