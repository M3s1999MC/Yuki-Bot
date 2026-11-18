const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'weekly',
    aliases: ['semanal'],
    category: 'economy',
    description: 'Reclama tu bonificación semanal en Bolívares dentro de la red.',

    async execute(sock, m, args, usedPrefix = '!') {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const username = sender.split('@')[0];
        const ahora = Date.now();
        const cooldown = 7 * 24 * 60 * 60 * 1000; // 7 días en ms
        const premio = 15000; // Ajustado a la escala económica de Yuki

        db.getSafeUser(sender, (err, user) => {
            if (err) {
                console.error('Error al registrar usuario para recompensa semanal:', err.message);
                return sock.sendMessage(jid, { text: '「✿」 ERROR DE RED // No pude consultar tu cuenta. 🥀' }, { quoted: m });
            }

            // Asegurar que la columna lastWeekly exista en la tabla users
            db.run(`ALTER TABLE users ADD COLUMN lastWeekly INTEGER DEFAULT 0`, () => {});

            const last = Number(user.lastWeekly) || 0;

            if (ahora - last < cooldown) {
                const tiempoRestanteMs = cooldown - (ahora - last);
                const dias = Math.floor(tiempoRestanteMs / (1000 * 60 * 60 * 24));
                const horas = Math.floor((tiempoRestanteMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                
                let tiempoTexto = dias > 0 ? `${dias} día(s) y ${horas} hora(s)` : `${horas} hora(s)`;

                return sock.sendMessage(jid, { 
                    text: `「✿」 RECOMPENSA SEMANAL YA RECLAMADA ⏳\n\n` +
                          `₊˚ˑ༄ Ya cobraste tu bonificación de esta semana en el ciberespacio.\n` +
                          `❀ Podrás volver a reclamar en: *${tiempoTexto}* ☕` 
                }, { quoted: m });
            }

            db.run(
                `UPDATE users SET wallet = wallet + ?, lastWeekly = ? WHERE jid = ? AND (lastWeekly IS NULL OR lastWeekly <= ?)`,
                [premio, ahora, sender, ahora - cooldown],
                function(updateErr) {
                    if (updateErr || !this.changes) {
                        if (updateErr) console.error('Error al otorgar recompensa semanal:', updateErr.message);
                        return sock.sendMessage(jid, { text: '「✿」 ERROR CRÍTICO // No se pudo reclamar la recompensa semanal. 🥀' }, { quoted: m });
                    }

                    const premioFormatted = premio.toLocaleString('es-CO');
                    const text = `「✿」 RECOMPENSA SEMANAL RECLAMADA 🎁✨\n\n` +
                                 `₊˚ˑ༄ Has recibido tu bonificación de la semana con éxito.\n` +
                                 `❀ 👤 *Usuario:* @${username}\n` +
                                 `❀ 💰 *Fondos acreditados:* \`+$${premioFormatted} Bolívares\` 💵\n` +
                                 `───────────────────\n` +
                                 `❀ _¡Gracias por tu gran constancia en la red de Yuki!_ 🌸`;

                    sock.sendMessage(jid, { text, mentions: [sender] }, { quoted: m });
                }
            );
        });
    }
};
