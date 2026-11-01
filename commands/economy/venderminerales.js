const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

const prices = { 'carbón': 150, hierro: 350, oro: 800, diamante: 2000 };

module.exports = {
    name: 'venderminerales',
    aliases: ['vendermin', 'vendertodo', 'sellores'],
    category: 'economy',
    description: 'Vende todos tus minerales o una clase específica.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const requestedMineral = args.join(' ').trim().toLowerCase();
        if (requestedMineral && !Object.prototype.hasOwnProperty.call(prices, requestedMineral)) {
            return sock.sendMessage(jid, { text: '「✿」 Mineral no válido. Opciones: carbón, hierro, oro o diamante.' }, { quoted: m });
        }

        db.all(
            `SELECT mineral, quantity FROM user_minerals WHERE user_jid = ? AND quantity > 0`,
            [sender],
            (findErr, rows) => {
                if (findErr) {
                    console.error('Error al consultar minerales para la venta:', findErr.message);
                    return sock.sendMessage(jid, { text: '「✿」 No pude consultar tu inventario.' }, { quoted: m });
                }
                const sold = rows.filter(row => !requestedMineral || row.mineral === requestedMineral);
                if (!sold.length) {
                    return sock.sendMessage(jid, { text: '「✿」 No tienes esos minerales para vender.' }, { quoted: m });
                }
                const total = sold.reduce((sum, row) => sum + row.quantity * prices[row.mineral], 0);
                db.run('BEGIN IMMEDIATE', (beginErr) => {
                    if (beginErr) {
                        console.error('No se pudo iniciar venta de minerales:', beginErr.message);
                        return sock.sendMessage(jid, { text: '「✿」 No se pudo iniciar la venta.' }, { quoted: m });
                    }
                    const rollback = (error) => db.run('ROLLBACK', (rollbackErr) => {
                        if (rollbackErr) console.error('Error al revertir venta de minerales:', rollbackErr.message);
                        if (error) console.error('Error al vender minerales:', error.message);
                        sock.sendMessage(jid, { text: '「✿」 No se pudo completar la venta.' }, { quoted: m });
                    });
                    let remaining = sold.length;
                    let failed = false;
                    for (const row of sold) {
                        db.run(`DELETE FROM user_minerals WHERE user_jid = ? AND mineral = ? AND quantity = ?`,
                            [sender, row.mineral, row.quantity], function(deleteErr) {
                                if (failed) return;
                                if (deleteErr || !this.changes) {
                                    failed = true;
                                    return rollback(deleteErr || new Error('El inventario cambió durante la venta.'));
                                }
                                remaining -= 1;
                                if (remaining !== 0) return;
                                db.run(`UPDATE users SET wallet = wallet + ? WHERE jid = ?`, [total, sender], (creditErr) => {
                                    if (creditErr) return rollback(creditErr);
                                    db.run('COMMIT', (commitErr) => {
                                        if (commitErr) return rollback(commitErr);
                                        sock.sendMessage(jid, {
                                            text: `「✿」 Vendiste ${sold.reduce((sum, row) => sum + row.quantity, 0)} mineral(es) por *$${total.toLocaleString('es-CO')}*. 💰🌸`
                                        }, { quoted: m });
                                    });
                                });
                            }
                        );
                    }
                });
            }
        );
    }
};
