const db = require('../../database/db');

module.exports = {
    name: 'goodbye',
    aliases: ['despedida', 'bye', 'adminonly', 'soloadmin', 'onlyadmin', 'modoadmin'],
    adminOnly: true,
    category: 'grupo',
    description: 'Configura despedidas y el modo Solo Admins.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '「✿」 Este comando solo funciona en grupos.' }, { quoted: m });
        }

        const body = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const command = body.replace(/^!/, '').trim().split(/\s+/)[0].toLowerCase();
        const value = (args[0] || '').toLowerCase();
        const enabled = ['on', 'activar', 'sí', 'si'].includes(value);
        const disabled = ['off', 'desactivar', 'no'].includes(value);
        if (!enabled && !disabled) {
            return sock.sendMessage(jid, { text: `「✿」 Usa !${command} on o !${command} off.` }, { quoted: m });
        }

        const column = ['goodbye', 'despedida', 'bye'].includes(command) ? 'goodbye_enabled' : 'admin_only';
        db.getSafeGroup(jid, (ensureErr) => {
            if (ensureErr) {
                console.error('Error al registrar configuración del grupo:', ensureErr.message);
                return sock.sendMessage(jid, { text: '「✿」 No pude cargar la configuración del grupo.' }, { quoted: m });
            }

            db.run(`UPDATE group_settings SET ${column} = ? WHERE group_jid = ?`, [enabled ? 1 : 0, jid], (err) => {
                if (err) {
                    console.error(`Error al actualizar ${column}:`, err.message);
                    return sock.sendMessage(jid, { text: '「✿」 No se pudo guardar la configuración.' }, { quoted: m });
                }
                const label = column === 'goodbye_enabled' ? 'despedida' : 'modo Solo Admins';
                sock.sendMessage(jid, { text: `「✿」 ${label}: ${enabled ? 'activado 🌸' : 'desactivado 💤'}.` }, { quoted: m });
            });
        });
    }
};
