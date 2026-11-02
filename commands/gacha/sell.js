const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'sell',
    aliases: ['vender'],
    category: 'gacha',
    description: 'Pone en venta uno de tus personajes reclamados.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const [characterName, priceText] = args.join(' ').split('|').map(value => value.trim());
        const price = Number(priceText);
        if (!characterName || !Number.isSafeInteger(price) || price < 1) {
            return sock.sendMessage(jid, { text: '「✿」 Usa !sell personaje | precio (precio entero mayor que 0).' }, { quoted: m });
        }

        const rollback = (message, error) => db.run('ROLLBACK', (rollbackErr) => {
            if (rollbackErr) console.error('Error al revertir publicación de venta:', rollbackErr.message);
            if (error) console.error('Error al publicar personaje en el mercado:', error.message);
            sock.sendMessage(jid, { text: message }, { quoted: m });
        });

        db.run('BEGIN IMMEDIATE', (beginErr) => {
            if (beginErr) {
                console.error('No se pudo iniciar publicación de venta:', beginErr.message);
                return sock.sendMessage(jid, { text: '「✿」 No se pudo iniciar la venta.' }, { quoted: m });
            }
            db.get(
                `SELECT id, character_name, series, image_url, value FROM harem
                 WHERE owner_jid = ? AND character_name LIKE ? COLLATE NOCASE LIMIT 1`,
                [sender, `%${characterName}%`],
                (findErr, character) => {
                    if (findErr || !character) return rollback('「✿」 No encontré ese personaje en tu harem.', findErr);
                    db.run(
                        `INSERT INTO market (seller_jid, character_name, series, image_url, price) VALUES (?, ?, ?, ?, ?)`,
                        [sender, character.character_name, character.series, character.image_url, price],
                        (insertErr) => {
                            if (insertErr) return rollback('「✿」 No se pudo publicar el personaje en la tienda.', insertErr);
                            db.run(`DELETE FROM harem WHERE id = ? AND owner_jid = ?`, [character.id, sender], function(deleteErr) {
                                if (deleteErr || !this.changes) return rollback('「✿」 No se pudo retirar el personaje de tu harem.', deleteErr);
                                db.run('COMMIT', (commitErr) => {
                                    if (commitErr) return rollback('「✿」 No se pudo confirmar la venta.', commitErr);
                                    sock.sendMessage(jid, {
                                        text: `「✿」 *${character.character_name}* está en venta por 💰 *${price.toLocaleString('es-CO')}*. Usa !wshop para verla. 🌸`
                                    }, { quoted: m });
                                });
                            });
                        }
                    );
                }
            );
        });
    }
};
