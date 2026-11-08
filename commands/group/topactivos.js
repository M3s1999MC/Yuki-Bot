const db = require('../../database/db');

module.exports = {
    name: 'topactivos',
    aliases: ['topmensajessemana'],
    description: 'Muestra el top de miembros más activos',
    async execute(sock, m) {
        if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: '⚠️ Este comando solo funciona en grupos.' }, { quoted: m });

        db.all(`SELECT user_jid, count FROM message_counts WHERE group_jid = ? ORDER BY count DESC LIMIT 10`, [m.key.remoteJid], async (err, rows) => {
            if (err || !rows || rows.length === 0) return sock.sendMessage(m.key.remoteJid, { text: '❌ Aún no hay registro de mensajes en este grupo.' }, { quoted: m });

            let texto = `🏆 *TOP 10 MÁS ACTIVOS DEL GRUPO* 🏆\n\n`;
            const mentions = [];
            rows.forEach((row, idx) => {
                texto += `${idx + 1}. @${row.user_jid.split('@')[0]} — *${row.count}* mensajes\n`;
                mentions.push(row.user_jid);
            });

            await sock.sendMessage(m.key.remoteJid, { text: texto, mentions }, { quoted: m });
        });
    }
};
