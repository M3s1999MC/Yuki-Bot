const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

const ORES_CONFIG = [
    { name: 'Carbón', emoji: '⚫', chance: 40, value: 150 },
    { name: 'Hierro', emoji: '⚙️', chance: 25, value: 350 },
    { name: 'Rubí', emoji: '🔴', chance: 15, value: 600 },
    { name: 'Oro', emoji: '🟡', chance: 10, value: 900 },
    { name: 'Diamante', emoji: '💎', chance: 6, value: 2000 },
    { name: 'Netherita', emoji: '🌌', chance: 4, value: 5000 }
];

function rollOre() {
    const roll = Math.random() * 100;
    let accumulated = 0;
    for (const ore of ORES_CONFIG) {
        accumulated += ore.chance;
        if (roll <= accumulated) return ore;
    }
    return ORES_CONFIG[0];
}

module.exports = {
    name: 'minar',
    aliases: ['mining', 'mine'],
    category: 'economy',
    description: 'Baja a las profundidades de la mina para extraer minerales raros y valiosos en Bolívares.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const username = sender.split('@')[0];

        // Asegurar la existencia del usuario en la base de datos central
        db.run(`INSERT OR IGNORE INTO users (jid, name, wallet) VALUES (?, ?, 0)`, [sender, username], (errUser) => {
            if (errUser) {
                console.error('Error al asegurar usuario en minería:', errUser.message);
                return sock.sendMessage(jid, { text: '「✿」 ERROR DE RED // No pude registrar tu acceso a la mina. 🥀' }, { quoted: m });
            }

            const ore = rollOre();
            const cantidad = 1; // Cantidad base extraída por turno de minería

            // Transacción: Guardar el mineral en user_minerals y premiar un bono extra en billetera opcional
            db.run(
                `INSERT INTO user_minerals (user_jid, mineral, quantity) VALUES (?, ?, ?)
                 ON CONFLICT(user_jid, mineral) DO UPDATE SET quantity = quantity + ?`,
                [sender, ore.name, cantidad, cantidad],
                (errMineral) => {
                    if (errMineral) {
                        console.error('Error al registrar mineral extraído:', errMineral.message);
                        return sock.sendMessage(jid, { text: '「✿」 ERROR DE MINERÍA // El túnel colapsó al guardar tu recurso. 🥀' }, { quoted: m });
                    }

                    const valorEstimadoF = ore.value.toLocaleString('es-CO');

                    const text = `「✿」 EXPEDICIÓN MINERA EXITOSA ⛏️✨\n\n` +
                                 `₊˚ˑ༄ Te adentraste en las profundidades oscuras y extrajiste un recurso:\n\n` +
                                 `❀ ${ore.emoji} *Mineral hallado:* \`${ore.name}\` (x${cantidad})\n` +
                                 `❀ 💰 *Valor estimado:* \`$${valorEstimadoF} Bolívares\`\n` +
                                 `───────────────────\n` +
                                 `❀ _Usa_ \`!minerales\` _para ver tu mochila o_ \`!venderminerales\` _para comerciar_ 🌸`;

                    sock.sendMessage(jid, { text, mentions: [sender] }, { quoted: m });
                }
            );
        });
    }
};
