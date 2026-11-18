const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'prestamo',
    aliases: ['préstamo', 'loan', 'prestar'],
    category: 'economy',
    description: 'Solicita un préstamo bancario, revisa tu estado de crédito o paga tus deudas en Bolívares.',

    async execute(sock, m, args, usedPrefix = '!') {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const subCommand = args[0]?.toLowerCase();

        // Asegurar tabla de préstamos si no existe
        db.run(`CREATE TABLE IF NOT EXISTS loans (
            user_jid TEXT PRIMARY KEY,
            amount INTEGER,
            due_date INTEGER
        )`, () => {});

        if (subCommand === 'estado') {
            db.get(`SELECT amount, due_date FROM loans WHERE user_jid = ?`, [sender], async (err, row) => {
                if (err) {
                    console.error('Error al consultar préstamo:', err.message);
                    return sock.sendMessage(jid, { text: '「✿」 ERROR DE RED // No pude verificar tu historial crediticio. 🥀' }, { quoted: m });
                }

                if (!row) {
                    return sock.sendMessage(jid, { 
                        text: `「✿」 ESTADO DE CRÉDITO 🏦✨\n\n` +
                              `₊˚ˑ༄ Estado actual con el Banco Central de Yuki:\n` +
                              `❀ *Deuda activa:* \`$0 Bolívares\`\n` +
                              `───────────────────\n` +
                              `❀ _¡Tienes un historial limpio y excelente reputación en la red!_ 🌸` 
                    }, { quoted: m });
                }

                const debtFormatted = row.amount.toLocaleString('es-CO');
                const timeLeftMs = row.due_date - Date.now();
                const daysLeft = Math.max(0, Math.ceil(timeLeftMs / (1000 * 60 * 60 * 24)));

                return sock.sendMessage(jid, { 
                    text: `「✿」 ESTADO DE CRÉDITO 🏦✨\n\n` +
                          `₊˚ˑ༄ Tienes un préstamo pendiente con el banco:\n` +
                          `❀ 💸 *Deuda total:* \`$${debtFormatted} Bolívares\`\n` +
                          `❀ ⏳ *Plazo restante:* \`${daysLeft} día(s)\`\n` +
                          `───────────────────\n` +
                          `❀ _Usa_ \`${usedPrefix}prestamo pagar\` _para saldar tu cuenta_ 🌸` 
                }, { quoted: m });
            });
            return;
        }

        if (subCommand === 'pagar') {
            db.get(`SELECT amount FROM loans WHERE user_jid = ?`, [sender], async (err, row) => {
                if (err || !row) {
                    return sock.sendMessage(jid, { 
                        text: '「✿」 SIN DEUDAS PENDIENTES 🥀\n\n₊˚ˑ༄ No tienes ningún préstamo activo que pagar en este momento.' 
                    }, { quoted: m });
                }

                db.getSafeUser(sender, async (errUser, user) => {
                    if (errUser || !user) {
                        return sock.sendMessage(jid, { text: '「✿」 ERROR DE RED // No pude verificar tu billetera. 🥀' }, { quoted: m });
                    }

                    const walletActual = Number(user.wallet) || 0;
                    const debtAmount = row.amount;

                    if (walletActual < debtAmount) {
                        return sock.sendMessage(jid, { 
                            text: `「✿」 FONDOS INSUFICIENTES 🥀\n\n` +
                                  `₊˚ˑ༄ No tienes suficientes Bolívares en tu billetera para pagar la totalidad del préstamo.\n` +
                                  `❀ *Deuda pendiente:* \`$${debtAmount.toLocaleString('es-CO')} Bolívares\`\n` +
                                  `❀ *Tu saldo actual:* \`$${walletActual.toLocaleString('es-CO')} Bolívares\` 📉` 
                        }, { quoted: m });
                    }

                    db.run(`UPDATE users SET wallet = wallet - ? WHERE jid = ?`, [debtAmount, sender], (updateErr) => {
                        if (updateErr) {
                            return sock.sendMessage(jid, { text: '「✿」 ERROR CRÍTICO // No se pudo debitar el pago del préstamo. 🥀' }, { quoted: m });
                        }

                        db.run(`DELETE FROM loans WHERE user_jid = ?`, [sender], async () => {
                            const debtFormatted = debtAmount.toLocaleString('es-CO');
                            await sock.sendMessage(jid, { 
                                text: `「✿」 DEUDA SALDADA CON ÉXITO 💳✨\n\n` +
                                      `₊˚ˑ༄ Has pagado por completo tu préstamo al Banco Central de Yuki.\n` +
                                      `❀ 💸 *Monto pagado:* \`-$${debtFormatted} Bolívares\`\n` +
                                      `───────────────────\n` +
                                      `❀ _¡Tu historial crediticio está impecable otra vez!_ 🌸`,
                                mentions: [sender]
                            }, { quoted: m });
                        });
                    });
                });
            });
            return;
        }

        const monto = parseInt(args[0]);
        if (!monto || isNaN(monto) || monto <= 0) {
            return sock.sendMessage(jid, { 
                text: `「✿」 BANCO CENTRAL DE YUKI 🏦✨\n\n` +
                      `₊˚ˑ༄ Solicita un crédito o revisa tu situación financiera:\n` +
                      `❀ *Uso:* \`${usedPrefix}prestamo <monto>\`\n` +
                      `❀ *Consultar estado:* \`${usedPrefix}prestamo estado\`\n` +
                      `❀ *Pagar deuda:* \`${usedPrefix}prestamo pagar\` 🌸` 
            }, { quoted: m });
        }

        // Límite máximo de préstamo estándar
        if (monto > 100000) {
            return sock.sendMessage(jid, { 
                text: '「✿」 LÍMITE DE CRÉDITO EXCEDIDO 🥀\n\n₊˚ˑ༄ El Banco Central de Yuki solo permite préstamos de hasta \`$100.000 Bolívares\` por solicitud.' 
            }, { quoted: m });
        }

        db.get(`SELECT amount FROM loans WHERE user_jid = ?`, [sender], async (err, row) => {
            if (row) {
                return sock.sendMessage(jid, { 
                    text: '「✿」 PRÉSTAMO ACTIVO EXISTENTE 🥀\n\n₊˚ˑ༄ Ya tienes un préstamo pendiente. Debes pagarlo antes de solicitar uno nuevo.' 
                }, { quoted: m });
            }

            const plazoDias = 6;
            const dueDate = Date.now() + (plazoDias * 24 * 60 * 60 * 1000);

            db.run(`INSERT INTO loans (user_jid, amount, due_date) VALUES (?, ?, ?)`, [sender, monto], (loanErr) => {
                if (loanErr) {
                    return sock.sendMessage(jid, { text: '「✿」 ERROR DE RED // No pude registrar tu préstamo en el banco. 🥀' }, { quoted: m });
                }

                db.run(`UPDATE users SET wallet = wallet + ? WHERE jid = ?`, [monto, sender], async (walletErr) => {
                    if (walletErr) {
                        return sock.sendMessage(jid, { text: '「✿」 ERROR CRÍTICO // No se pudieron depositar los fondos en tu billetera. 🥀' }, { quoted: m });
                    }

                    const montoFormatted = monto.toLocaleString('es-CO');

                    const text = `「✿」 PRÉSTAMO APROBADO 🏦✨\n\n` +
                                 `₊˚ˑ༄ El Banco Central de Yuki ha procesado tu solicitud con éxito.\n` +
                                 `❀ 💰 *Fondos depositados:* \`+$${montoFormatted} Bolívares\`\n` +
                                 `❀ ⏳ *Plazo de pago:* \`${plazoDias} días\`\n` +
                                 `───────────────────\n` +
                                 `❀ _¡Recuerda pagar a tiempo para evitar sanciones en la red!_ 🌸`;

                    await sock.sendMessage(jid, { text, mentions: [sender] }, { quoted: m });
                });
            });
        });
    }
};
