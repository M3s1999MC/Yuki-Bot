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
        
        // Si no escriben nada, selecciona un objetivo caótico por defecto
        const defaultTargets = ['la base secreta de la nasa', 'el Imperio Romano', 'la tostadora de la esquina', 'un servidor de Aternos', 'la matrix'];
        const objetivo = args.length > 0 ? args.join(' ') : defaultTargets[Math.floor(Math.random() * defaultTargets.length)];
        
        const victoria = Math.random() > 0.45;

        db.getSafeUser(sender, async (err, user) => {
            if (err || !user) {
                return sock.sendMessage(jid, { text: '₊˚ˑ༄ [!] No se pudo verificar tu estatus militar en la red. 🥀' }, { quoted: m });
            }

            if (victoria) {
                const botin = Math.floor(Math.random() * 2500) + 800;
                
                db.run(`UPDATE users SET wallet = wallet + ? WHERE jid = ?`, [botin, sender], async (updateErr) => {
                    if (updateErr) {
                        console.error('Error al actualizar botín de bombardeo:', updateErr.message);
                        return;
                    }
                    
                    await sock.sendMessage(jid, {
                        text: `₊˚ˑ༄ 𝖄𝖚𝖐𝖎 // ATAQUE AÉREO EXITOSO 🚀✨\n\n` +
                              `❀ ❟ Destruiste y saqueaste con éxito a: **${objetivo}**.\n` +
                              `❀ 💰 *Botín obtenido:* \`+$${botin.toLocaleString('es-CO')} Bolívares\` 💵\n` +
                              `───────────────────\n` +
                              `❀ ¡Pura hiperinflación para las arcas enemigas! 🌸`,
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
                        text: `₊˚ˑ༄ 𝖄𝖚𝖐𝖎 // DEFENSAS ACTIVADAS 🛡️💥\n\n` +
                              `❀ ❟ Las contramedidas de **${objetivo}** repelieron tu ataque catastróficamente.\n` +
                              `❀ 💸 *Pagaste por daños de guerra:* \`-$${multaReal.toLocaleString('es-CO')} Bolívares\` 📉\n` +
                              `───────────────────\n` +
                              `❀ ¡Te arruinó el operativo el objetivo, tonto! 🥀`,
                        mentions: [sender]
                    }, { quoted: m });
                });
            }
        });
    }
};
