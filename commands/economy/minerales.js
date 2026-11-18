const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

const catalog = [
    '❀ ⚫ *Carbón* — 50% probabilidad · \`$150 Bolívares\`',
    '❀ ⚙️ *Hierro* — 30% probabilidad · \`$350 Bolívares\`',
    '❀ 🟡 *Oro* — 15% probabilidad · \`$800 Bolívares\`',
    '❀ 💎 *Diamante* — 5% probabilidad · \`$2.000 Bolívares\`'
];

module.exports = {
    name: 'minerales',
    aliases: ['mochila', 'inventario', 'ores'],
    category: 'economy',
    description: 'Muestra los minerales que tienes en tu inventario o el catálogo de probabilidades.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        
        if ((args[0] || '').toLowerCase() === 'catalogo') {
            const catalogText = `「✿」 CATÁLOGO DE MINERALES ⛏️✨\n\n` +
                                `₊˚ˑ༄ Probabilidades y valores estimados de extracción:\n\n` +
                                catalog.join('\n') + `\n\n` +
                                `───────────────────\n` +
                                `❀ _¡Usa !minar para probar tu suerte en las profundidades!_ 🌸`;

            return sock.sendMessage(jid, { text: catalogText }, { quoted: m });
        }

        db.all(`SELECT mineral, quantity FROM user_minerals WHERE user_jid = ? ORDER BY mineral`, [sender], (err, rows) => {
            if (err) {
                console.error('Error al consultar inventario minero:', err.message);
                return sock.sendMessage(jid, { 
                    text: '「✿」 ERROR DE RED // No pude consultar tu mochila minera. 🥀' 
                }, { quoted: m });
            }

            const text = rows.length
                ? `「✿」 MOCHILA DE MINERALES 🎒✨\n\n` +
                  `₊˚ˑ༄ Recursos extraídos en tus jornadas de minería:\n\n` +
                  rows.map(row => `❀ • *${row.mineral}:* \`${row.quantity} unidades\``).join('\n') + `\n\n` +
                  `───────────────────\n` +
                  `❀ _Usa_ \`!venderminerales\` _para comerciar tus recursos_ 🌸`
                : `「✿」 MOCHILA VACÍA 🥀\n\n` +
                  `₊˚ˑ༄ No tienes ningún mineral guardado en tu inventario.\n` +
                  `❀ Usa \`!minar\` para comenzar a excavar en la red ⛏️`;

            sock.sendMessage(jid, { text, mentions: [sender] }, { quoted: m });
        });
    }
};
