const db = require('../../database/db');

module.exports = {
    name: 'buychar',
    aliases: ['buyc', 'buycharacter', 'comprar'],
    category: 'gacha',
    description: 'Compra un personaje disponible en el mercado.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const buyer = jid.endsWith('@g.us') ? (m.key.participant || jid) : jid;
        const query = args.join(' ').trim();
        if (!query) {
            return sock.sendMessage(jid, { text: '「✿」 Indica el número o nombre del personaje. Ejemplo: !buychar 1' }, { quoted: m });
        }

        db.all(`SELECT * FROM market ORDER BY id`, [], (listErr, items) => {
            if (listErr) {
                console.error('Error al consultar el mercado gacha:', listErr.message);
                return sock.sendMessage(jid, { text: '「✿」 No pude consultar el mercado.' }, { quoted: m });
            }
            if (!items.length) {
                return sock.sendMessage(jid, { text: '「✿」 No hay personajes en venta por ahora. 🛒' }, { quoted: m });
            }

            const numeric = /^\d+$/.test(query);
            const selected = numeric
                ? items[Number(query) - 1]
                : items.find(item => item.character_name.toLowerCase().includes(query.toLowerCase()));
            if (!selected) {
                return sock.sendMessage(jid, { text: '「✿」 No encontré ese personaje en la tienda.' }, { quoted: m });
            }
            if (selected.seller_jid === buyer) {
                return sock.sendMessage(jid, { text: '「✿」 No puedes comprar tu propio personaje.' }, { quoted: m });
            }

            db.getSafeUser(buyer, (buyerErr) => {
                if (buyerErr) {
                    console.error('Error al registrar comprador:', buyerErr.message);
                    return sock.sendMessage(jid, { text: '「✿」 No pude preparar tu cuenta.' }, { quoted: m });
                }
                db.getSafeUser(selected.seller_jid, (sellerErr) => {
                    if (sellerErr) {
                        console.error('Error al registrar vendedor:', sellerErr.message);
                        return sock.sendMessage(jid, { text: '「✿」 No pude preparar la cuenta del vendedor.' }, { quoted: m });
                    }

                    const rollback = (message, error) => db.run('ROLLBACK', (rollbackErr) => {
                        if (rollbackErr) console.error('Error al revertir compra gacha:', rollbackErr.message);
                        if (error) console.error('Error al procesar compra gacha:', error.message);
                        sock.sendMessage(jid, { text: message }, { quoted: m });
                    });
                    db.run('BEGIN IMMEDIATE', (beginErr) => {
                        if (beginErr) {
                            console.error('No se pudo iniciar compra gacha:', beginErr.message);
                            return sock.sendMessage(jid, { text: '「✿」 No se pudo iniciar la compra.' }, { quoted: m });
                        }
                        db.run(`UPDATE users SET wallet = wallet - ? WHERE jid = ? AND wallet >= ?`, [selected.price, buyer, selected.price], function(paymentErr) {
                            if (paymentErr || !this.changes) {
                                return rollback('「✿」 No tienes suficiente saldo en tu billetera para comprarlo.', paymentErr);
                            }
                            db.run(`UPDATE users SET wallet = wallet + ? WHERE jid = ?`, [selected.price, selected.seller_jid], (creditErr) => {
                                if (creditErr) return rollback('「✿」 No se pudo acreditar el pago al vendedor.', creditErr);
                                db.run(
                                    `INSERT INTO harem (owner_jid, character_name, series, image_url, value) VALUES (?, ?, ?, ?, ?)`,
                                    [buyer, selected.character_name, selected.series, selected.image_url, selected.price],
                                    (insertErr) => {
                                        if (insertErr) return rollback('「✿」 No se pudo agregar el personaje a tu harem.', insertErr);
                                        db.run(`DELETE FROM market WHERE id = ?`, [selected.id], function(deleteErr) {
                                            if (deleteErr || !this.changes) return rollback('「✿」 La oferta ya no está disponible.', deleteErr);
                                            db.run('COMMIT', (commitErr) => {
                                                if (commitErr) return rollback('「✿」 No se pudo confirmar la compra.', commitErr);
                                                sock.sendMessage(jid, {
                                                    text: `「✿」 @${buyer.split('@')[0]} compró *${selected.character_name}* por 💰 *${Number(selected.price).toLocaleString('es-CO')}* a @${selected.seller_jid.split('@')[0]}. 🌸`,
                                                    mentions: [buyer, selected.seller_jid]
                                                }, { quoted: m });
                                            });
                                        });
                                    }
                                );
                            });
                        });
                    });
                });
            });
        });
    }
};
