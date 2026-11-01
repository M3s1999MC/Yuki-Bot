const db = require('../../database/db');

module.exports = {
    name: 'setprimary',
    aliases: ['botprincipal', 'setbot', 'delprimary', 'unsetprimary', 'quitarprimary', 'delbotprincipal'],
    adminOnly: true,
    category: 'grupo',
    description: 'Designa o quita la instancia primaria del bot en el grupo.',

    async execute(sock, m) {
        const jid = m.key.remoteJid;
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '「✿」 Este comando solo funciona en grupos.' }, { quoted: m });
        }
        const body = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const command = body.replace(/^!/, '').trim().split(/\s+/)[0].toLowerCase();
        const remove = ['delprimary', 'unsetprimary', 'quitarprimary', 'delbotprincipal'].includes(command);
        const botJid = sock.user?.id?.split(':')[0];
        if (!remove && !botJid) {
            return sock.sendMessage(jid, { text: '「✿」 No pude identificar esta instancia del bot.' }, { quoted: m });
        }

        db.getSafeGroup(jid, (ensureErr) => {
            if (ensureErr) {
                console.error('Error al registrar instancia primaria:', ensureErr.message);
                return sock.sendMessage(jid, { text: '「✿」 No pude cargar la configuración del grupo.' }, { quoted: m });
            }
            const sql = remove
                ? `UPDATE group_settings SET primary_bot_jid = NULL WHERE group_jid = ?`
                : `UPDATE group_settings SET primary_bot_jid = ? WHERE group_jid = ?`;
            const params = remove ? [jid] : [botJid, jid];
            db.run(sql, params, (err) => {
                if (err) {
                    console.error('Error al actualizar instancia primaria:', err.message);
                    return sock.sendMessage(jid, { text: '「✿」 No se pudo actualizar la instancia primaria.' }, { quoted: m });
                }
                const text = remove
                    ? '「✿」 Se quitó la instancia primaria de este grupo. 🌸'
                    : `「✿」 Esta instancia (@${botJid.split('@')[0]}) quedó como bot primario del grupo. 🌸`;
                sock.sendMessage(jid, { text, mentions: remove ? [] : [botJid] }, { quoted: m });
            });
        });
    }
};
