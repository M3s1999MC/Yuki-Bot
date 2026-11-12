const db = require('../../database/db');

module.exports = {
    name: 'yuki',
    aliases: ['botgc', 'onbot'],
    adminOnly: true,
    category: 'grupo',
    description: 'Activa o desactiva al bot en este grupo.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '「✿」 Este comando solo funciona en grupos.' }, { quoted: m });
        }

        const value = (args[0] || '').toLowerCase();
        const enabled = ['on', 'activar'].includes(value);
        const disabled = ['off', 'desactivar'].includes(value);
        if (!enabled && !disabled) {
            return sock.sendMessage(jid, { text: '「✿」 Usa !yuki on o !yuki off.' }, { quoted: m });
        }

        db.getSafeGroup(jid, (ensureErr) => {
            if (ensureErr) {
                console.error('Error al registrar configuración del grupo:', ensureErr.message);
                return sock.sendMessage(jid, { text: '「✿」 No pude cargar la configuración del grupo.' }, { quoted: m });
            }
            db.run(`UPDATE group_settings SET Yuki_active = ? WHERE group_jid = ?`, [enabled ? 1 : 0, jid], (err) => {
                if (err) {
                    console.error('Error al actualizar Yuki_active:', err.message);
                    return sock.sendMessage(jid, { text: '「✿」 No se pudo guardar la configuración.' }, { quoted: m });
                }
                sock.sendMessage(jid, { text: `「✿」 Yuki quedó ${enabled ? 'activa 🌸' : 'en pausa 💤'} en este grupo.` }, { quoted: m });
            });
        });
    }
};
