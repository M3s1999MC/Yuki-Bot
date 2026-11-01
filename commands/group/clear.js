const db = require('../../database/db');

const INACTIVE_DAYS = 30;

module.exports = {
    name: 'clear',
    category: 'grupo',
    description: 'Elimina del harem global los personajes de miembros inactivos por 30 días.',
    adminOnly: true,

    async execute(sock, m) {
        const jid = m.key.remoteJid;
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '「✿」 Este comando solo funciona en grupos.' }, { quoted: m });
        }

        let metadata;
        try {
            metadata = await sock.groupMetadata(jid);
        } catch (err) {
            console.error('Error al consultar miembros para limpiar el harem:', err);
            return sock.sendMessage(jid, { text: '「✿」 No pude consultar los miembros del grupo.' }, { quoted: m });
        }
        const memberJids = new Set((metadata.participants || [])
            .filter(participant => !participant.admin)
            .flatMap(participant => [participant.id, participant.jid, participant.lid].filter(Boolean)));
        if (!memberJids.size) {
            return sock.sendMessage(jid, { text: '「✿」 No hay miembros del grupo para revisar.' }, { quoted: m });
        }

        const cutoff = Date.now() - INACTIVE_DAYS * 24 * 60 * 60 * 1000;
        db.all(
            `SELECT user_jid FROM message_counts WHERE group_jid = ? AND last_message_at > 0 AND last_message_at < ?`,
            [jid, cutoff],
            (activityErr, rows) => {
                if (activityErr) {
                    console.error('Error al consultar inactividad del grupo:', activityErr.message);
                    return sock.sendMessage(jid, { text: '「✿」 No pude consultar la actividad del grupo.' }, { quoted: m });
                }
                const inactiveJids = [...new Set(rows.map(row => row.user_jid).filter(userJid => memberJids.has(userJid)))];
                if (!inactiveJids.length) {
                    return sock.sendMessage(jid, { text: `「✿」 No hay miembros con actividad registrada hace más de ${INACTIVE_DAYS} días. 🌸` }, { quoted: m });
                }

                const placeholders = inactiveJids.map(() => '?').join(', ');
                db.run(`DELETE FROM harem WHERE owner_jid IN (${placeholders})`, inactiveJids, function(deleteErr) {
                    if (deleteErr) {
                        console.error('Error al limpiar personajes de miembros inactivos:', deleteErr.message);
                        return sock.sendMessage(jid, { text: '「✿」 No se pudo limpiar el harem de miembros inactivos.' }, { quoted: m });
                    }
                    sock.sendMessage(jid, {
                        text: `「✿」 Limpieza completada 🌸\nSe eliminaron *${this.changes}* personaje(s) del harem global de ${inactiveJids.length} miembro(s) inactivo(s) por más de ${INACTIVE_DAYS} días.`,
                        mentions: inactiveJids
                    }, { quoted: m });
                });
            }
        );
    }
};
