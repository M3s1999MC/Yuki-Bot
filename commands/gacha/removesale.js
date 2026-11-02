const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'removesale',
    aliases: ['removerventa'],
    category: 'gacha',
    description: 'Retira del mercado un personaje que pusiste en venta.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const query = args.join(' ').trim();
        if (!query) {
            return sock.sendMessage(jid, { text: '「✿」 Indica el nombre o número de tu oferta en !removesale.' }, { quoted: m });
        }

        db.all(`SELECT * FROM market WHERE seller_jid = ? ORDER BY id`, [sender], (listErr, items) => {
            if (listErr) {
                console.error('Error al consultar tus ofertas:', listErr.message);
                return sock.sendMessage(jid, { text: '「✿」 No pude consultar tus ofertas.' }, { quoted: m });
            }
            const selected = /^\d+$/.test(query)
                ? items[Number(query) - 1]
                : items.find(item => item.character_name.toLowerCase().includes(query.toLowerCase()));
            if (!selected) {
                return sock.sendMessage(jid, { text: '「✿」 No encontré esa oferta entre tus ventas.' }, { quoted: m });
            }

            db.run('BEGIN IMMEDIATE', (beginErr) => {
                if (beginErr) {
                    console.error('No se pudo iniciar retiro de oferta:', beginErr.message);
                    return sock.sendMessage(jid, { text: '「✿」 No se pudo iniciar la operación.' }, { quoted: m });
                }
                const rollback = (error) => db.run('ROLLBACK', (rollbackErr) => {
                    if (rollbackErr) console.error('Error al revertir retiro de oferta:', rollbackErr.message);
                    if (error) console.error('Error al retirar oferta:', error.message);
                    sock.sendMessage(jid, { text: '「✿」 No se pudo retirar la oferta.' }, { quoted: m });
                });
                db.run(`DELETE FROM market WHERE id = ? AND seller_jid = ?`, [selected.id, sender], function(deleteErr) {
                    if (deleteErr || !this.changes) return rollback(deleteErr || new Error('La oferta ya no está disponible.'));
                    db.run(
                        `INSERT INTO harem (owner_jid, character_name, series, image_url, value) VALUES (?, ?, ?, ?, ?)`,
                        [sender, selected.character_name, selected.series, selected.image_url, selected.price],
                        (insertErr) => {
                            if (insertErr) return rollback(insertErr);
                            db.run('COMMIT', (commitErr) => {
                                if (commitErr) return rollback(commitErr);
                                sock.sendMessage(jid, { text: `「✿」 Retiraste *${selected.character_name}* del mercado y volvió a tu harem. 🌸` }, { quoted: m });
                            });
                        }
                    );
                });
            });
        });
    }
};
