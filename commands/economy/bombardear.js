const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'bombardear',
    aliases: ['bomb'],
    category: 'economy',
    description: 'Bombardea cualquier objetivo del multiverso con riesgo de ganar botín o pagar daños.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        
        const defaultTargets = ['la base secreta de la nasa', 'el Imperio Romano', 'la tostadora de la esquina', 'un servidor de Aternos', 'la matrix'];
        const objetivo = args.length > 0 ? args.join(' ') : defaultTargets[Math.floor(Math.random() * defaultTargets.length)];
        
        const victoria = Math.random() > 0.45;

        db.getSafeUser(sender, async (err, user) => {
            if (err || !user) {
                return sock.sendMessage(jid, {
                    text: [
                        '🌸 ˚୨୧⋆｡˚ ⋆ *¡UPS!* ⋆ ˚｡⋆୨୧˚ 🌸',
                        '🍡 _¡Ay, se me perdieron los radaritos y no pude revisar tu ficha!_ 💦',
                        '',
                        '✦ *Estado:* Error al consultar tu cuenta ♡',
                        '',
                        '━━━━━━━━━━ 🌸 ━━━━━━━━━━',
                        '_Inténtalo de nuevo en un ratito, ¿sí? - Orihime 🌸_'
                    ].join('\n')
                }, { quoted: m });
            }

            if (victoria) {
                const botin = Math.floor(Math.random() * 2500) + 800;
                
                db.run(`UPDATE users SET wallet = wallet + ? WHERE jid = ?`, [botin, sender], async (updateErr) => {
                    if (updateErr) {
                        console.error('Error al actualizar botín de bombardeo:', updateErr.message);
                        return;
                    }
                    
                    await sock.sendMessage(jid, {
                        text: [
                            '🌸 ˚୨୧⋆｡˚ ⋆ *¡BOOM! ¡ACERTAMOS!* ⋆ ˚｡⋆୨୧˚ 🌸',
                            `🍡 _¡Whoa, le diste directo a *${objetivo}* y llenamos la canasta!_ ✨`,
                            '',
                            `✦ *Objetivo:* ${objetivo}`,
                            `✦ *Botín obtenido:* \`+$${botin.toLocaleString('es-CO')} Bolívares\` 💵`,
                            '━━━━━━━━━━ 🌸 ━━━━━━━━━━',
                            '♡ _¡Qué puntería tan traviesa tienes! Ven a presumirme tus moneditas~_ 🍡',
                            '_Con emoción, Orihime 🌸_'
                        ].join('\n'),
                        mentions: [sender]
                    }, { quoted: m });
                });
            } else {
                const multa = Math.floor(Math.random() * 1500) + 500;
                const walletActual = Number(user.wallet) || 0;
                const multaReal = Math.min(multa, walletActual);

                db.run(`UPDATE users SET wallet = MAX(0, wallet - ?) WHERE jid = ?`, [multaReal, sender], async (updateErr) => {
                    if (updateErr) {
                        console.error('Error al cobrar daños de bombardeo:', updateErr.message);
                        return;
                    }

                    await sock.sendMessage(jid, {
                        text: [
                            '🌸 ˚୨୧⋆｡˚ ⋆ *¡AY, NOOO!* ⋆ ˚｡⋆୨୧˚ 🌸',
                            `🍡 _¡Las defensas de *${objetivo}* nos devolvieron el susto!_ 💦`,
                            '',
                            `✦ *Objetivo:* ${objetivo}`,
                            `✦ *Daños pagados:* \`-$${multaReal.toLocaleString('es-CO')} Bolívares\` 📉`,
                            '━━━━━━━━━━ 🌸 ━━━━━━━━━━',
                            '♡ _¡Ay, qué travesura tan cara! No te desanimes, ¿sí? Yo te cuido~_ 🌸',
                            '_Aún te quiero, Orihime ♡_'
                        ].join('\n'),
                        mentions: [sender]
                    }, { quoted: m });
                });
            }
        });
    }
};
