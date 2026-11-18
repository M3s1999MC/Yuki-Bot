
const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'emisiones',
    aliases: ['misioneseconomia', 'tareas', 'misiones'],
    category: 'economy',
    description: 'Consulta y cobra tus misiones diarias de economía en Bolívares.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const subcomando = (args[0] || '').toLowerCase();

        db.getSafeUser(sender, async (err, user) => {
            if (err || !user) {
                return sock.sendMessage(jid, { 
                    text: '「✿」 ERROR DE RED // No pude verificar tu progreso en el sistema central. 🥀' 
                }, { quoted: m });
            }

            if (subcomando === 'cobrar' || subcomando === 'claim') {
                const now = Date.now();
                const cooldown = 24 * 60 * 60 * 1000;
                const lastClaim = Number(user.lastMisiones) || 0;

                if (now - lastClaim < cooldown) {
                    const remainingMs = cooldown - (now - lastClaim);
                    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
                    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

                    return sock.sendMessage(jid, { 
                        text: `「✿」 MISIONES YA COBRADAS ⏳\n\n` +
                              `₊˚ˑ༄ Ya reclamaste tus recompensas del día.\n` +
                              `❀ Nuevas tareas disponibles en: *${hours}h ${minutes}m* ☕` 
                    }, { quoted: m });
                }

                const recompensaTotal = 2500; // $1,000 + $1,500 Bolívares

                db.run(
                    `UPDATE users SET wallet = wallet + ?, lastMisiones = ? WHERE jid = ?`,
                    [recompensaTotal, now, sender],
                    async (updateErr) => {
                        if (updateErr) {
                            console.error('Error al cobrar misiones:', updateErr.message);
                            return sock.sendMessage(jid, { 
                                text: '「✿」 ERROR CRÍTICO // No se pudo acreditar la recompensa; inténtalo de nuevo. 🥀' 
                            }, { quoted: m });
                        }

                        const textCobro = `「✿」 RECOMPENSAS RECLAMADAS 🌸✨\n\n` +
                                          `₊˚ˑ༄ Has cobrado con éxito tus misiones diarias de la red.\n` +
                                          `❀ 💰 *Botín acreditado:* \`+$${recompensaTotal.toLocaleString('es-CO')} Bolívares\` 💵\n` +
                                          `───────────────────\n` +
                                          `❀ _¡Vuelve mañana para nuevos encargos financieros!_ ☕`;

                        await sock.sendMessage(jid, { text: textCobro, mentions: [sender] }, { quoted: m });
                    }
                );
                return;
            }

            const text = `「✿」 MISIONES DIARIAS DE ECONOMÍA 📋✨\n\n` +
                         `₊˚ˑ༄ Completa los encargos del sistema para ganar fondos extra:\n\n` +
                         `❀ 🪙 *1. Ahorrador:* Deposita 3 veces en el banco\n` +
                         `   ↳ *Recompensa:* \`+$1,000 Bolívares\`\n\n` +
                         `❀ ⛏️ *2. Minero:* Usa \`!minar\` 2 veces en la red\n` +
                         `   ↳ *Recompensa:* \`+$1,500 Bolívares\`\n` +
                         `───────────────────\n` +
                         `❀ 💡 Usa \`!emisiones cobrar\` para reclamar tus ganancias 🌸`;

            await sock.sendMessage(jid, { text }, { quoted: m });
        });
    }
};
