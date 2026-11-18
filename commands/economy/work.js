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
        const cooldown = 30 * 60 * 1000; // 30 minutos de cooldown

        db.getSafeUser(sender, (err, user) => {
            if (err) {
                console.error('Error al registrar usuario en work:', err.message);
                return sock.sendMessage(jid, { text: '「✿」 ERROR DE RED // No pude consultar tu cuenta en el sistema central. 🥀' }, { quoted: m });
            }

            const last = Number(user.lastWork) || 0;

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

            // Opciones de trabajos temáticos en el ciberespacio
            const trabajos = [
                'repostero de pasteles de fresa',
                'asistente en la librería digital de Akihabara',
                'repartidor de ramen a domicilio por el ciberespacio',
                'organizador de estanterías y servidores en el supermercado'
            ];
            const trabajoElegido = trabajos[Math.floor(Math.random() * trabajos.length)];

            // Probabilidad de éxito (85% éxito, 15% fallo)
            const esExito = Math.random() < 0.85;

            if (!esExito) {
                // Actualizamos solo el cooldown aunque haya fallado para que no haga spam
                db.run(`UPDATE users SET lastWork = ? WHERE jid =[span_0](start_span)[span_0](end_span)`, [now, sender], () => {});

                return sock.sendMessage(jid, { 
                    text: `「✿」 JORNADA LABORAL FALLIDA 🥀\n\n` +
                          `₊˚ˑ༄ Te quedaste dormido en el puesto de trabajo como *${trabajoElegido}* y el jefe te descontó el día.\n` +
                          `───────────────────\n` +
                          `❀ _¡Inténtalo de nuevo cuando recuperes energías!_ 📉`,
                    mentions: [sender]
                }, { quoted: m });
            }

            // Generar pago aleatorio entre 500 y 2000 Bolívares
            const reward = Math.floor(Math.random() * (2000 - 500 + 1)) + 500;

            db.run(`UPDATE users SET wallet = wallet + ?, lastWork = ? WHERE jid = ?`,
                [reward, now, sender], function(updateErr) {
                    if (updateErr) {
                        console.error('Error al otorgar pago de work:', updateErr.message);
                        return sock.sendMessage(jid, { text: '「✿」 ERROR CRÍTICO // No se pudo procesar tu pago. 🥀' }, { quoted: m });
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
