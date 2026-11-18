const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'periodic',
    aliases: ['weekly', 'monthly', 'semanal', 'mensual'],
    category: 'economy',
    description: 'Reclama tu recompensa económica semanal o mensual en Bolívares.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const ahora = Date.now();

        const body = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const commandUsed = body.slice(1).trim().split(/ +/)[0].toLowerCase();

        const esWeekly = ['weekly', 'semanal'].includes(commandUsed);
        const intervalo = esWeekly ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
        const premio = esWeekly ? 15000 : 60000; // Ajustado a la escala económica en Bolívares
        const columnaTiempo = esWeekly ? 'lastWeekly' : 'lastMonthly';
        const tipoNombre = esWeekly ? 'semanal' : 'mensual';

        // Asegurar columnas de tiempo en base de datos si no existen
        db.run(`ALTER TABLE users ADD COLUMN lastWeekly INTEGER DEFAULT 0`, () => {});
        db.run(`ALTER TABLE users ADD COLUMN lastMonthly INTEGER DEFAULT 0`, () => {});

        db.run(`INSERT OR IGNORE INTO users (jid, wallet) VALUES (?, 0)`, [sender], () => {
            db.get(`SELECT wallet, ${columnaTiempo} FROM users WHERE jid = ?`, [sender], async (err, row) => {
                if (err) {
                    console.error('Error al consultar recompensa periódica:', err.message);
                    return sock.sendMessage(jid, { 
                        text: '「✿」 ERROR DE RED // No pude verificar tu estado financiero. 🥀' 
                    }, { quoted: m });
                }

                const ultimoReclamo = row && row[columnaTiempo] ? row[columnaTiempo] : 0;

                if (ahora - ultimoReclamo < intervalo) {
                    const tiempoRestanteMs = intervalo - (ahora - ultimoReclamo);
                    const dias = Math.floor(tiempoRestanteMs / (1000 * 60 * 60 * 24));
                    const horas = Math.floor((tiempoRestanteMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

                    const tiempoTexto = dias > 0 ? `${dias}d ${horas}h` : `${horas} hora(s)`;

                    return await sock.sendMessage(jid, { 
                        text: `「✿」 RECOMPENSA YA RECLAMADA ⏳\n\n` +
                              `₊˚ˑ༄ Ya cobraste tu paga ${tipoNombre} en la red.\n` +
                              `❀ Podrás volver a reclamar en: *${tiempoTexto}* ☕` 
                    }, { quoted: m });
                }

                const walletActual = row ? (Number(row.wallet) || 0) : 0;
                const nuevaWallet = walletActual + premio;

                db.run(`UPDATE users SET wallet = ?, ${columnaTiempo} = ? WHERE jid = ?`, [nuevaWallet, ahora, sender], async (updateErr) => {
                    if (updateErr) {
                        console.error('Error al actualizar recompensa periódica:', updateErr.message);
                        return sock.sendMessage(jid, { 
                            text: '「✿」 ERROR CRÍTICO // No se pudo acreditar la recompensa periódica. 🥀' 
                        }, { quoted: m });
                    }

                    const premioFormatted = premio.toLocaleString('es-CO');

                    const text = `「✿」 RECOMPENSA ${tipoNombre.toUpperCase()} RECLAMADA 🎁✨\n\n` +
                                 `₊˚ˑ༄ Has recibido tu pago corporativo periódico con éxito.\n` +
                                 `❀ 💰 *Fondos acreditados:* \`+$${premioFormatted} Bolívares\` 💵\n` +
                                 `───────────────────\n` +
                                 `❀ _¡Gracias por tu actividad constante en la red de Yuki!_ 🌸`;

                    await sock.sendMessage(jid, { text, mentions: [sender] }, { quoted: m });
                });
            });
        });
    }
};
