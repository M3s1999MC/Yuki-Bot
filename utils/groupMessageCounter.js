const { getCanonicalMessageCountJid } = require('./messageSender');

async function recordGroupMessages(db, sock, messages) {
    for (const message of messages || []) {
        const groupJid = message?.key?.remoteJid;
        if (!message?.message || !groupJid?.endsWith('@g.us')) continue;

        try {
            const userJid = await getCanonicalMessageCountJid(message, sock);
            if (!userJid) continue;

            db.run(
                `INSERT INTO message_counts (group_jid, user_jid, count, last_message_at) VALUES (?, ?, 1, ?)
                 ON CONFLICT(group_jid, user_jid) DO UPDATE SET count = message_counts.count + 1, last_message_at = excluded.last_message_at`,
                [groupJid, userJid, Date.now()],
                err => {
                    if (err) console.error('Error al actualizar el conteo del grupo:', err.message);
                }
            );
        } catch (err) {
            console.error('Error al resolver el JID del conteo del grupo:', err.message);
        }
    }
}

module.exports = { recordGroupMessages };
