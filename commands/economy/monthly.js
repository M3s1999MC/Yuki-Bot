const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'monthly',
    aliases: ['mensual', 'sueldo'],
    category: 'economy',
    description: 'Reclama tu sueldo o recompensa mensual en Bolívares.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const username = sender.split('@')[0];

        db.getSafeUser(sender, async (err, user) => {
            if (err || !user) {
                return sock.sendMessage(jid, { 
                    text: '「✿」 ERROR DE RED // No pude verificar tu cuenta en el sistema central. 🥀' 
                }, { quoted: m });
            }

            const now = Date.now();
            const cooldown = 30 * 24 * 60 * 60 * 1000; // 30 días en milisegundos
            const lastMonthly = Number(user.lastMonthly) || 0;

            if (now - lastMonthly < cooldown) {
                const remainingMs = cooldown - (now - lastMonthly);
                const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
                const hours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

                return sock.sendMessage(jid, { 
                    text: `「✿」 SUELDO MENSUAL YA RECLAMADO ⏳\n\n` +
                          `₊˚ˑ༄ Ya cobraste tu paga mensual en la red.\n` +
                          `❀ Podrás volver a cobrar en: *${days}d ${hours}h* ☕` 
                }, { quoted: m });
            }

            const recompensa = 50000; // $50,000 Bolívares

            db.run(
                `UPDATE users SET wallet = wallet + ?, lastMonthly = ? WHERE jid = ?`,
                [recompensa, now, sender],
                async (updateErr) => {
                    if (updateErr) {
                        console.error('Error al cobrar mensualidad:', updateErr.message);
                        return sock.sendMessage(jid, { 
                            text: '「✿」 ERROR CRÍTICO // No se pudo acreditar el sueldo mensual; inténtalo de nuevo. 🥀' 
                        }, { quoted: m });
                    }

                    const recompensaF = recompensa.toLocaleString('es-CO');

                    const text = `「✿」 SUELDO MENSUAL RECLAMADO 🗓️✨\n\n` +
                                 `₊˚ˑ༄ Has recibido tu pago mensual corporativo con éxito.\n` +
                                 `❀ 💰 *Fondos acreditados:* \`+$${recompensaF} Bolívares\` 💵\n` +
                                 `───────────────────\n` +
                                 `❀ _¡Gracias por tu dedicación continua en la red de Yuki!_ 🌸`;

                    await sock.sendMessage(jid, { text, mentions: [sender] }, { quoted: m });
                }
            );
        });
    }
};
