const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'apuesta',
    aliases: ['casino', 'bet'],
    category: 'economy',
    description: 'Apuesta tus Bolívares en el casino de Yuki.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const montoInput = args[0];

        if (!montoInput) {
            return await sock.sendMessage(jid, { 
                text: `₊˚ˑ༄ 𝖄𝖚𝖐𝖎 // CASINO 𓍢ִ໋☕\n\n` +
                      `❀ ❟ Indica la cantidad de Bolívares que deseas apostar.\n` +
                      `❀ Uso: \`!apuesta <cantidad>\` o \`!apuesta todo\` 🥀` 
            }, { quoted: m });
        }

        db.getSafeUser(sender, async (err, user) => {
            if (err || !user) {
                return await sock.sendMessage(jid, { text: '₊˚ˑ༄ [!] No se pudo consultar tu saldo en la base de datos. 🥀' }, { quoted: m });
            }

            const currentBalance = user.wallet || user.balance || 0;
            let monto;

            if (montoInput.toLowerCase() === 'todo' || montoInput.toLowerCase() === 'all') {
                monto = currentBalance;
            } else {
                monto = parseInt(montoInput);
            }

            if (isNaN(monto) || monto <= 0) {
                return await sock.sendMessage(jid, { text: '₊˚ˑ༄ [✿] Debes ingresar una cantidad válida mayor a 0 para apostar. 🎲' }, { quoted: m });
            }

            if (currentBalance < monto) {
                return await sock.sendMessage(jid, { 
                    text: `₊˚ˑ༄ [!] No tienes tantos fondos.\n❀ *Tu saldo actual:* \`$${currentBalance.toLocaleString()} Bolívares\` 📉` 
                }, { quoted: m });
            }

            // Probabilidad de ganar (48% de victoria)
            const gano = Math.random() >= 0.52;

            if (gano) {
                // Gana el doble de lo apostado (100% de ganancia neta o ajusta el multiplicador)
                const ganancia = Math.floor(monto * 1.5);
                
                db.run(`UPDATE users SET wallet = wallet + ? WHERE jid = ?`, [ganancia, sender], async (updateErr) => {
                    if (updateErr) {
                        console.error('Error al actualizar saldo de apuesta:', updateErr.message);
                        return;
                    }
                    await sock.sendMessage(jid, { 
                        text: `₊˚ˑ༄ 𝖄𝖚𝖐𝖎 ꔛ ¡VICTORIA EN EL CASINO! 🎰✨\n\n` +
                              `❀ ❟ La suerte estuvo de tu lado.\n` +
                              `❀ ❟ *Premio obtenido:* \`+$${ganancia.toLocaleString()} Bolívares\` 💵`,
                        mentions: [sender]
                    }, { quoted: m });
                });
            } else {
                // Pierde lo apostado
                db.run(`UPDATE users SET wallet = wallet - ? WHERE jid = ?`, [monto, sender], async (updateErr) => {
                    if (updateErr) {
                        console.error('Error al actualizar saldo de apuesta:', updateErr.message);
                        return;
                    }
                    await sock.sendMessage(jid, { 
                        text: `₊˚ˑ༄ 𝖄𝖚𝖐𝖎 ꔛ ¡DERROTA EN EL CASINO! 💸💀\n\n` +
                              `❀ ❟ La casa siempre gana, tonto.\n` +
                              `❀ ❟ *Perdiste:* \`-$${monto.toLocaleString()} Bolívares\` 📉`,
                        mentions: [sender]
                    }, { quoted: m });
                });
            }
        });
    }
};
