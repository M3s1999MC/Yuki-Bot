const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'count',
    aliases: ['mensajes', 'messages', 'msgcount', 'topcount', 'topmensajes', 'topmsgcount', 'topmessages'],
    category: 'grupo',
    description: 'Muestra el conteo de mensajes o el top de actividad del grupo.',

    async execute(sock, m) {
        const jid = m.key.remoteJid;
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '「✿」 Este comando solo funciona en grupos.' }, { quoted: m });
        }

        const body = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const command = body.replace(/^!/, '').trim().split(/\s+/)[0].toLowerCase();
        const isTop = ['topcount', 'topmensajes', 'topmsgcount', 'topmessages'].includes(command);
        const context = m.message?.extendedTextMessage?.contextInfo;
        const target = context?.mentionedJid?.[0] || context?.participant || getMessageSenderJid(m, sock);

        if (isTop) {
            return db.all(
                `SELECT user_jid, count FROM message_counts WHERE group_jid = ? ORDER BY count DESC LIMIT 10`,
                [jid],
                (err, rows) => {
                    if (err) {
                        console.error('Error al consultar el top de mensajes:', err.message);
                        return sock.sendMessage(jid, { text: '「✿」 No pude consultar las estadísticas del grupo.' }, { quoted: m });
                    }
                    const text = rows.length
                        ? `「✿」 Top de mensajes 🌸\n\n${rows.map((row, i) => `${i + 1}. @${row.user_jid.split('@')[0]} — *${row.count}*`).join('\n')}`
                        : '「✿」 Aún no hay mensajes registrados en este grupo.';
                    sock.sendMessage(jid, { text, mentions: rows.map(row => row.user_jid) }, { quoted: m });
                }
            );
        }

        if (!target) {
            return sock.sendMessage(jid, { text: '「✿」 Menciona o responde a una persona para consultar su conteo.' }, { quoted: m });
        }
        db.get(`SELECT count FROM message_counts WHERE group_jid = ? AND user_jid = ?`, [jid, target], (err, row) => {
            if (err) {
                console.error('Error al consultar el conteo de mensajes:', err.message);
                return sock.sendMessage(jid, { text: '「✿」 No pude consultar el conteo de mensajes.' }, { quoted: m });
            }
            sock.sendMessage(jid, {
                text: `「✿」 Mensajes de @${target.split('@')[0]}: *${row?.count || 0}* 📊`,
                mentions: [target]
            }, { quoted: m });
        });
    }
};
