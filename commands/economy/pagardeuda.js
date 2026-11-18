const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'pagardeuda',
    aliases: ['pagarprestamo', 'saldardeuda'],
    category: 'economy',
    description: 'Paga una cuota o salda la deuda de tus préstamos pendientes en la red.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const cuotaBase = 2000; // Valor estándar de la cuota o préstamo a saldar

        db.getSafeUser(sender, async (err, user) => {
            if (err || !user) {
                return sock.sendMessage(jid, { 
                    text: '「✿」 ERROR DE RED // No pude verificar tu cuenta en el sistema central. 🥀' 
                }, { quoted: m });
            }

            const walletActual = Number(user.wallet) || 0;
            // Si el usuario especifica un monto personalizado, lo tomamos; de lo contrario, usamos la cuota base
            const montoArg = parseInt(args[0]);
            const pago = (!isNaN(montoArg) && montoArg > 0) ? montoArg : cuotaBase;

            if (walletActual < pago) {
                return sock.sendMessage(jid, { 
                    text: `「✿」 FONDOS INSUFICIENTES 🥀\n\n` +
                          `₊˚ˑ༄ No tienes suficientes Bolívares en tu billetera para pagar esta cuota.\n` +
                          `❀ *Monto a pagar:* \`$${pago.toLocaleString('es-CO')} Bolívares\`\n` +
                          `❀ *Tu saldo actual:* \`$${walletActual.toLocaleString('es-CO')} Bolívares\` 📉` 
                }, { quoted: m });
            }

            db.run(`UPDATE users SET wallet = wallet - ? WHERE jid = ?`, [pago, sender], async (updateErr) => {
                if (updateErr) {
                    console.error('Error al procesar pago de deuda:', updateErr.message);
                    return sock.sendMessage(jid, { 
                        text: '「✿」 ERROR CRÍTICO // No se pudo procesar el pago de la deuda. 🥀' 
                    }, { quoted: m });
                }

                const pagoFormatted = pago.toLocaleString('es-CO');

                const text = `「✿」 PAGO DE DEUDA EXITOSO 💳✨\n\n` +
                             `₊˚ˑ༄ Has realizado el abono correspondiente a tus obligaciones financieras.\n` +
                             `❀ 💰 *Monto abonado:* \`-$${pagoFormatted} Bolívares\` 💵\n` +
                             `───────────────────\n` +
                             `❀ _¡Mantén tus finanzas limpias en la red de Yuki!_ 🌸`;

                await sock.sendMessage(jid, { text, mentions: [sender] }, { quoted: m });
            });
        });
    }
};
