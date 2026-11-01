const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'work',
    aliases: ['trabajar'],
    category: 'economy',
    description: 'Trabaja para ganar dinero para tu billetera.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const jobs = ['Programador indie', 'Animador 3D en Blender', 'Diseñador UI', 'Repartidor de arepas'];
        const currentJob = jobs[Math.floor(Math.random() * jobs.length)];
        const earned = Math.floor(Math.random() * 800) + 200;

        db.getSafeUser(sender, (ensureErr) => {
            if (ensureErr) {
                console.error('Error al registrar usuario para trabajar:', ensureErr.message);
                return sock.sendMessage(jid, { text: '「✿」 No pude preparar tu billetera.' }, { quoted: m });
            }
            db.run(`UPDATE users SET wallet = wallet + ? WHERE jid = ?`, [earned, sender], (err) => {
                if (err) {
                    console.error('Error al acreditar salario:', err.message);
                    return sock.sendMessage(jid, { text: '「✿」 No se pudo acreditar tu salario.' }, { quoted: m });
                }
                const caption = `「✿」 Trabajo completado 🌸\n\n` +
                    `🛠️ Ocupación: *${currentJob}*\n` +
                    `💰 Ganancia: *+$${earned.toLocaleString('es-CO')}*`;
                sock.sendMessage(jid, { text: caption }, { quoted: m });
            });
        });
    }
};