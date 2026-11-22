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
                text: [
                    '🌸 ˚୨୧⋆｡˚ ⋆ *CASINO DE YUKI* ⋆ ˚｡⋆୨୧˚ 🌸',
                    '🍡 _¡Holaaa! ¿Quieres probar suerte conmigo en la mesita? Dime cuánto vas a poner~_ 🎲',
                    '',
                    '✦ *Uso:* `!apuesta <cantidad>` o `!apuesta todo`',
                    '━━━━━━━━━━ 🌸 ━━━━━━━━━━',
                    '♡ _¡No te vayas a emocionar demasiado sin avisarme, ¿sí?_',
                    '_Te espero en la mesa, Orihime 🌸_'
                ].join('\n')
            }, { quoted: m });
        }

        db.getSafeUser(sender, async (err, user) => {
            if (err || !user) {
                return await sock.sendMessage(jid, {
                    text: [
                        '🌸 ˚୨୧⋆｡˚ ⋆ *¡UPS!* ⋆ ˚｡⋆୨୧˚ 🌸',
                        '🍡 _¡Ay, se me perdieron las fichas y no pude revisar tu saldo!_ 💦',
                        '',
                        '✦ *Estado:* Error al consultar tu cuenta ♡',
                        '',
                        '━━━━━━━━━━ 🌸 ━━━━━━━━━━',
                        '_Inténtalo de nuevo en un ratito, ¿sí? - Orihime 🌸_'
                    ].join('\n')
                }, { quoted: m });
            }

            const currentBalance = user.wallet || user.balance || 0;
            let monto;

            if (montoInput.toLowerCase() === 'todo' || montoInput.toLowerCase() === 'all') {
                monto = currentBalance;
            } else {
                monto = parseInt(montoInput);
            }

            if (isNaN(monto) || monto <= 0) {
                return await sock.sendMessage(jid, {
                    text: [
                        '🌸 ˚୨୧⋆｡˚ ⋆ *¡OJO AHÍ!* ⋆ ˚｡⋆୨୧˚ 🌸',
                        '🍡 _¡Ese numerito no me sirve para jugar! Pon un monto mayor a 0~_ 🎲',
                        '',
                        '✦ *Ejemplo:* `!apuesta 500` o `!apuesta todo`',
                        '',
                        '━━━━━━━━━━ 🌸 ━━━━━━━━━━',
                        '_Con cariño, Orihime ♡_'
                    ].join('\n')
                }, { quoted: m });
            }

            if (currentBalance < monto) {
                return await sock.sendMessage(jid, {
                    text: [
                        '🌸 ˚୨୧⋆｡˚ ⋆ *¡NO ALCANZA!* ⋆ ˚｡⋆୨୧˚ 🌸',
                        '🍡 _¡Ay, te faltan moneditas para esa apuesta! No te quedes sin nada~_ 💦',
                        '',
                        `✦ *Tu saldo actual:* \`$${currentBalance.toLocaleString()} Bolívares\` 📉`,
                        '━━━━━━━━━━ 🌸 ━━━━━━━━━━',
                        '♡ _Si quieres, primero junta un poquito más conmigo~_',
                        '_Te cuido, Orihime 🌸_'
                    ].join('\n')
                }, { quoted: m });
            }

            // Probabilidad de ganar (48% de victoria)
            const gano = Math.random() >= 0.52;

            if (gano) {
                // Gana 1.5x de lo apostado
                const ganancia = Math.floor(monto * 1.5);
                
                db.run(`UPDATE users SET wallet = wallet + ? WHERE jid = ?`, [ganancia, sender], async (updateErr) => {
                    if (updateErr) {
                        console.error('Error al actualizar saldo de apuesta:', updateErr.message);
                        return;
                    }
                    await sock.sendMessage(jid, {
                        text: [
                            '🌸 ˚୨୧⋆｡˚ ⋆ *¡SÍÍÍ! ¡GANASTE!* ⋆ ˚｡⋆୨୧˚ 🌸',
                            '🍡 _¡Qué suerte tan bonita tuviste hoy! ¡La mesita te sonrió!_ 🎰✨',
                            '',
                            `✦ *Premio obtenido:* \`+$${ganancia.toLocaleString()} Bolívares\` 💵`,
                            '━━━━━━━━━━ 🌸 ━━━━━━━━━━',
                            '♡ _¡Celebremos juntos este golpe de suerte!_',
                            '_Con emoción, Orihime 🌸_'
                        ].join('\n'),
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
                        text: [
                            '🌸 ˚୨୧⋆｡˚ ⋆ *¡AY, SE FUE!* ⋆ ˚｡⋆୨୧˚ 🌸',
                            '🍡 _¡Esta vez la suerte se escondió un poquito... no te me pongas triste!_ 💦',
                            '',
                            `✦ *Perdiste:* \`-$${monto.toLocaleString()} Bolívares\` 📉`,
                            '━━━━━━━━━━ 🌸 ━━━━━━━━━━',
                            '♡ _¡Ánimo! A la próxima seguro nos va mucho mejor, ¿sí?_',
                            '_Aún te quiero, Orihime ♡_'
                        ].join('\n'),
                        mentions: [sender]
                    }, { quoted: m });
                });
            }
        });
    }
};
