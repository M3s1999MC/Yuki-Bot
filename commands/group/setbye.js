const db = require('../../database/db');

module.exports = {
    name: 'setbye',
    category: 'groups',
    description: 'Edita el mensaje de despedida del grupo con broches ({usuario}, {grupo}, {miembros}).',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        if (!jid.endsWith('@g.us')) {
            return await sock.sendMessage(jid, { text: '⚠️ Este comando solo se puede usar en grupos.' }, { quoted: m });
        }

        const mensaje = args.join(' ');
        if (!mensaje) {
            return await sock.sendMessage(jid, {
                text: '(「✿」 "CONFIGURAR DESPEDIDA"🌸)\n\n⚠️ Escribe el mensaje usando broches como `{usuario}`, `{grupo}`, `{miembros}`.\n*Uso:* `!setbye ¡Adiós {usuario} de {grupo}!`'
            }, { quoted: m });
        }

        db.getSafeGroup(jid, (err) => {
            if (err) {
                return sock.sendMessage(jid, { text: '⚠️ Error al acceder a la base de datos del grupo.' }, { quoted: m });
            }

            db.run(`UPDATE group_settings SET goodbye_text = ?, goodbye_enabled = 1 WHERE group_jid = ?`, [mensaje, jid], async (err2) => {
                if (err2) {
                    console.error('Error al actualizar goodbye_text:', err2.message);
                    return sock.sendMessage(jid, { text: '⚠️ Error al guardar el mensaje de despedida.' }, { quoted: m });
                }

                await sock.sendMessage(jid, {
                    text: '(「✿」 "DESPEDIDA GUARDADA"🌸)\n\n✅ El mensaje personalizado de despedida ha sido actualizado y activado con éxito.'
                }, { quoted: m });
            });
        });
    }
};
