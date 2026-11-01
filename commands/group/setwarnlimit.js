// setwarnlimit.js
const db = require('../../database/db');
module.exports = {
    name: 'setwarnlimit',
    aliases: ['warnlimit', 'limiteadvertencias'],
    adminOnly: true,
    category: 'group',
    description: 'Configura el límite de advertencias.',
    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        if (!jid.endsWith('@g.us')) return;

        const limit = parseInt(args[0]);
        if (isNaN(limit) || limit < 1) return await sock.sendMessage(jid, { text: '❌ Especifica un número válido mayor a 0.' }, { quoted: m });

        db.getSafeGroup(jid, (ensureErr) => {
            if (ensureErr) {
                console.error('Error al registrar configuración del grupo:', ensureErr.message);
                return sock.sendMessage(jid, { text: '「✿」 No pude cargar la configuración del grupo.' }, { quoted: m });
            }
            db.run(`UPDATE group_settings SET warn_limit = ? WHERE group_jid = ?`, [limit, jid], (err) => {
                if (err) {
                    console.error('Error al actualizar warn_limit:', err.message);
                    return sock.sendMessage(jid, { text: '「✿」 No se pudo guardar el límite de advertencias.' }, { quoted: m });
                }
                sock.sendMessage(jid, { text: `「✿」 Límite de advertencias actualizado: *${limit}*. 🌸` }, { quoted: m });
            });
        });
    }
};