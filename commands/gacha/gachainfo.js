const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'gachainfo',
    aliases: ['ginfo', 'infogacha'],
    category: 'gacha',
    description: 'Muestra tus datos y estadísticas de gacha.',

    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        db.getSafeUser(sender, (err, user) => {
            if (err) {
                console.error('Error al consultar datos gacha del usuario:', err.message);
                return sock.sendMessage(jid, { text: '「✿」 No pude consultar tu información gacha.' }, { quoted: m });
            }
            db.get(`SELECT COUNT(*) AS total, COALESCE(SUM(value), 0) AS value FROM harem WHERE owner_jid = ?`, [sender], (countErr, stats) => {
                if (countErr) {
                    console.error('Error al consultar estadísticas del harem:', countErr.message);
                    return sock.sendMessage(jid, { text: '「✿」 No pude consultar tus estadísticas.' }, { quoted: m });
                }
                const text = `「✿」 Tus estadísticas gacha 🌸\n\n` +
                    `💖 Personajes: *${stats.total}*\n` +
                    `💎 Valor del harem: *${Number(stats.value).toLocaleString('es-CO')}*\n` +
                    `⭐ Principal: *${user.main_waifu || 'Ninguno'}*\n` +
                    `🎟️ Tickets: *${user.tickets || 0}*`;
                sock.sendMessage(jid, { text, mentions: [sender] }, { quoted: m });
            });
        });
    }
};
