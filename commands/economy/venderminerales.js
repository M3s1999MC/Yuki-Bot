const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

const prices = { 'carbón': 150, hierro: 350, oro: 800, diamante: 2000 };

module.exports = {
    name: 'venderminerales',
    aliases: ['vendermin', 'vendertodo', 'sellores'],
    category: 'economy',
    description: 'Vende todos tus minerales o una clase específica a cambio de Bolívares en la red.',

    async execute(sock, m, args, usedPrefix = '!') {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const requestedMineral = args.join(' ').trim().toLowerCase();

        if (requestedMineral && !Object.prototype.hasOwnProperty.call(prices, requestedMineral)) {
            return sock.sendMessage(jid, { 
                text: `「✿」 MINERAL NO VÁLIDO 🥀\n\n` +
                      `₊˚ˑ༄ Opciones disponibles en el mercado de minerales:\n` +
                      `❀ \`carbón\` ($150)\n` +
                      `❀ \`hierro\` ($350)\n` +
                      `❀ \`oro\` ($800)\n` +
                      `❀ \`diamante\` ($2.000)\n\n` +
                      `───────────────────\n` +
                      `❀ *Uso:* \`${usedPrefix}venderminerales [mineral]\` 🌸` 
            }, { quoted: m });
        }

        db.all(
            `SELECT mineral, quantity FROM user_minerals WHERE user_jid = ? AND quantity > 0`,
            [sender],
            (findErr, rows) => {
                if (findErr) {
                    console.error('Error al consultar minerales para la venta:', findErr.message);
                    return sock.sendMessage(jid, { text: '「✿」 ERROR DE RED // No pude consultar tu inventario de minerales. 🥀' }, { quoted: m });
                }

                const sold = rows.filter(row => !requestedMineral || row.mineral === requestedMineral);
                if (!sold.length) {
                    return sock.sendMessage(jid, { 
                        text: `「✿」 SIN MINERALES PARA VENDER 🥀\n\n₊˚ˑ༄ No tienes ${requestedMineral ? `el mineral *${requestedMineral}*` : 'ningún mineral en tu inventario'} en este momento.` 
                    }, { quoted: m });
                }

                const total = sold.reduce((sum, row) => sum + row.quantity * prices[row.mineral], 0);

                db.run('BEGIN IMMEDIATE', (beginErr) => {
                    if (beginErr) {
                        console.error('No se pudo iniciar venta de minerales:', beginErr.message);
                        return sock.sendMessage(jid, { text: '「✿」 ERROR CRÍTICO // No se pudo iniciar la transacción en el mercado. 🥀' }, { quoted: m });
                    }

                    const rollback = (error) => db.run('ROLLBACK', (rollbackErr) => {
                        if (rollbackErr) console.error('Error al revertir venta de minerales:', rollbackErr.message);
                        if (error) console.error('Error al vender minerales:', error.message);
                        sock.sendMessage(jid, { text: '「✿」 ERROR // No se pudo completar la venta de minerales. 🥀' }, { quoted: m });
                    });

                    let remaining = sold.length;
                    let failed = false;

                    for (const row of sold) {
                        db.run(
                            `DELETE FROM user_minerals WHERE user_jid = ? AND mineral = ? AND quantity = ?`,
                            [sender, row.mineral, row.quantity],
                            function(deleteErr) {
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

                                        const totalCantidad = sold.reduce((sum, r) => sum + r.quantity, 0).toLocaleString('es-CO');
                                        const totalF = total.toLocaleString('es-CO');

                                        const text = `「✿」 VENTA DE MINERALES EXITOSA ⛏️✨\n\n` +
                                                     `₊˚ˑ༄ Has entregado tus recursos al mercado central de la red.\n` +
                                                     `❀ 📦 *Minerales vendidos:* \`${totalCantidad} unidad(es)\`\n` +
                                                     `❀ 💰 *Ganancias obtenidas:* \`+$${totalF} Bolívares\` 💵\n` +
                                                     `───────────────────\n` +
                                                     `❀ _¡Excelente recolección en el ciberespacio!_ 🌸`;

                                        sock.sendMessage(jid, { text, mentions: [sender] }, { quoted: m });
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
