const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'tienda',
    aliases: ['shop'],
    category: 'economy',
    description: 'Consulta la tienda general de Yuki o adquiere tickets de captura utilizando Bolívares.',

    async execute(sock, m, args, usedPrefix = '!') {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const subcommand = (args[0] || '').toLowerCase();
        const item = (args[1] || '').toLowerCase();

        if (!['buy', 'comprar'].includes(subcommand)) {
            const catalogText = args.length
                ? `「✿」 USO INCORRECTO DE LA TIENDA 🌸\n\n₊˚ˑ༄ Para adquirir artículos debes usar:\n❀ \`${usedPrefix}shop buy ticket\` o \`${usedPrefix}tienda comprar ticket\``
                : `「✿」 TIENDA GENERAL DE YUKI 🏪✨\n\n` +
                  `₊˚ˑ༄ Artículos disponibles en stock:\n\n` +
                  `❀ 🎟️ *Ticket de captura* — \`$1.500 Bolívares\`\n` +
                  `   ↳ _Permite capturar criaturas y personajes en la red._\n\n` +
                  `───────────────────\n` +
                  `❀ *Compra con:* \`${usedPrefix}shop buy ticket\` 🌸`;

            return sock.sendMessage(jid, { text: catalogText }, { quoted: m });
        }

        if (!['ticket', 'tickets'].includes(item)) {
            return sock.sendMessage(jid, { 
                text: `「✿」 ARTÍCULO NO ENCONTRADO 🥀\n\n₊˚ˑ༄ El único artículo disponible actualmente en la tienda es el *ticket*.\n❀ *Uso:* \`${usedPrefix}shop buy ticket\` 🌸` 
            }, { quoted: m });
        }

        const price = 1500;
        const priceFormatted = price.toLocaleString('es-CO');

        db.getSafeUser(sender, (err) => {
            if (err) {
                console.error('Error al registrar usuario para comprar en tienda:', err.message);
                return sock.sendMessage(jid, { text: '「✿」 ERROR DE RED // No pude preparar tu cuenta para la compra. 🥀' }, { quoted: m });
            }

            // Asegurar que la columna tickets exista en la tabla users
            db.run(`ALTER TABLE users ADD COLUMN tickets INTEGER DEFAULT 0`, () => {});

            db.run(
                `UPDATE users SET wallet = wallet - ?, tickets = tickets + 1 WHERE jid = ? AND wallet >= ?`,
                [price, sender, price],
                function(purchaseErr) {
                    if (purchaseErr || !this.changes) {
                        if (purchaseErr) console.error('Error al comprar ticket:', purchaseErr.message);
                        return sock.sendMessage(jid, { 
                            text: `「✿」 FONDOS INSUFICIENTES 🥀\n\n` +
                                  `₊˚ˑ༄ No tienes suficientes Bolívares en tu billetera para adquirir el ticket.\n` +
                                  `❀ *Precio:* \`$${priceFormatted} Bolívares\` 📉` 
                        }, { quoted: m });
                    }

                    const text = `「✿」 COMPRA EXITOSA EN LA TIENDA 🎟️✨\n\n` +
                                 `₊˚ˑ༄ Has adquirido 1x *Ticket de captura* con éxito.\n` +
                                 `❀ 💸 *Costo:* \`$${priceFormatted} Bolívares\`\n` +
                                 `───────────────────\n` +
                                 `❀ _¡Ya puedes usar_ \`${usedPrefix}atrapar <ID>\` _en la red!_ 🌸`;

                    sock.sendMessage(jid, { text, mentions: [sender] }, { quoted: m });
                }
            );
        });
    }
};
