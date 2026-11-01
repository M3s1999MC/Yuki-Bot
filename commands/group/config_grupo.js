const db = require('../../database/db');

module.exports = {
    name: 'welcome',
    aliases: ['bienvenida', 'antilink', 'antienlace', 'antilinks'],
    adminOnly: true,
    category: 'grupo',
    description: 'Activa o desactiva bienvenida y protección contra enlaces.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '「✿」 Este comando solo funciona en grupos.' }, { quoted: m });
        }

        const body = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const command = body.replace(/^!/, '').trim().split(/\s+/)[0].toLowerCase();
        const enabled = ['on', 'activar', 'sí', 'si'].includes((args[0] || '').toLowerCase());
        const disabled = ['off', 'desactivar', 'no'].includes((args[0] || '').toLowerCase());
        if (!enabled && !disabled) {
            return sock.sendMessage(jid, { text: `「✿」 Usa !${command} on o !${command} off.` }, { quoted: m });
        }

        const column = ['welcome', 'bienvenida'].includes(command) ? 'welcome_enabled' : 'antilink';
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
                const label = column === 'welcome_enabled' ? 'bienvenida' : 'antilink';
                sock.sendMessage(jid, { text: `「✿」 ${label} ${enabled ? 'activada 🌸' : 'desactivada 💤'}.` }, { quoted: m });
            });
        });
    }
};
