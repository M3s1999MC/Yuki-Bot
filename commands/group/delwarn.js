// delwarn.js
const db = require('../../database/db');
module.exports = {
    name: 'delwarn',
    aliases: ['eliminaradvertencia'],
    adminOnly: true,
    category: 'group',
    description: 'Elimina las advertencias de un usuario.',
    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        if (!jid.endsWith('@g.us')) return;

        let target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.participant;
        if (!target) return await sock.sendMessage(jid, { text: '❌ Menciona al usuario al que le deseas quitar las advertencias.' }, { quoted: m });

        db.run(`DELETE FROM warnings WHERE group_jid = ? AND user_jid = ?`, [jid, target], function(err) {
            if (err) {
                console.error('Error al borrar advertencias:', err.message);
                return sock.sendMessage(jid, { text: '「✿」 No se pudieron eliminar las advertencias.' }, { quoted: m });
            }
            sock.sendMessage(jid, {
                text: `「✿」 Se eliminaron *${this.changes}* advertencias de @${target.split('@')[0]}. 🌸`,
                mentions: [target]
            }, { quoted: m });
        });
    }
};