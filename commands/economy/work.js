const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'work',
    aliases: ['w', 'trabajar'],
    category: 'economy',
    description: 'Realiza una jornada laboral en diversos oficios de la red para ganar Bolívares.',

    async execute(sock, m, args, usedPrefix = '!') {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const now = Date.now();
        const cooldown = 30 * 60 * 1000; // 30 minutos

        db.getSafeUser(sender, (err, user) => {
            if (err || !user) {
                if (err) console.error('Error al consultar usuario en work:', err.message);
                return sock.sendMessage(jid, {
                    text: `「✿」 ERROR DE RED 🥀\n\n` +
                          `₊˚ˑ༄ No pude consultar tu cuenta en el sistema central.`
                }, { quoted: m });
            }

            const last = Number(user.lastwork ?? user.lastWork) || 0;

            if (now - last < cooldown) {
                const remainingMs = cooldown - (now - last);
                const minutes = Math.floor(remainingMs / (1000 * 60));
                const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

                return sock.sendMessage(jid, {
                    text: `「✿」 DESCANSO REQUERIDO ⏳\n\n` +
                          `₊˚ˑ༄ Estás agotado de tu última jornada en la red.\n` +
                          `❀ Podrás volver a trabajar en: *${minutes}m ${seconds}s* ☕`
                }, { quoted: m });
            }

            const trabajos = [
                'repostero de pasteles de fresa',
                'asistente en la librería digital de Akihabara',
                'repartidor de ramen a domicilio por el ciberespacio',
                'organizador de estanterías y servidores en el supermercado'
            ];
            const trabajoElegido = trabajos[Math.floor(Math.random() * trabajos.length)];

            const esExito = Math.random() < 0.85;

            if (!esExito) {
                db.run(`UPDATE users SET lastwork = ? WHERE jid = ?`, [now, sender], (updateErr) => {
                    if (updateErr) console.error('Error al actualizar cooldown de work:', updateErr.message);
                });

                return sock.sendMessage(jid, {
                    text: `「✿」 JORNADA LABORAL FALLIDA 🥀\n\n` +
                          `₊˚ˑ༄ Te quedaste dormido en el puesto de trabajo como *${trabajoElegido}* y el jefe te descontó el día.\n` +
                          `───────────────────\n` +
                          `❀ _¡Inténtalo de nuevo cuando recuperes energías!_ 📉`,
                    mentions: [sender]
                }, { quoted: m });
            }

            const reward = Math.floor(Math.random() * (2000 - 500 + 1)) + 500;

            db.run(`UPDATE users SET wallet = wallet + ?, lastwork = ? WHERE jid = ?`,
                [reward, now, sender], function(updateErr) {
                    if (updateErr) {
                        console.error('Error al otorgar pago de work:', updateErr.message);
                        return sock.sendMessage(jid, {
                            text: `「✿」 ERROR CRÍTICO 🥀\n\n` +
                                  `₊˚ˑ༄ No se pudo procesar tu pago en la base de datos.`
                        }, { quoted: m });
                    }

                    const recompensaFormateada = reward.toLocaleString('es-CO');

                    const text = `「✿」 JORNADA COMPLETADA 💼✨\n\n` +
                                 `₊˚ˑ༄ Trabajaste duro como *${trabajoElegido}*.\n` +
                                 `❀ 💰 *Pago recibido:* \`+$${recompensaFormateada} Bolívares\`\n` +
                                 `───────────────────\n` +
                                 `❀ _¡Tu esfuerzo impulsa la economía de Yuki!_ 🌸`;

                    sock.sendMessage(jid, { text, mentions: [sender] }, { quoted: m });
                });
        });
    }
};
