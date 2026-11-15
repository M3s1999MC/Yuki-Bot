const db = require('../../database/db');

module.exports = {
    name: 'setwelcome',
    category: 'groups',
    description: 'Edita el mensaje de bienvenida del grupo con broches ({usuario}, {grupo}, {miembros}).',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        if (!jid.endsWith('@g.us')) {
            return await sock.sendMessage(jid, { text: '⚠️ Este comando solo se puede usar en grupos.' }, { quoted: m });
        }

        const mensaje = args.join(' ');
        if (!mensaje) {
            return await sock.sendMessage(jid, {
                text: '(「✿」 "CONFIGURAR BIENVENIDA"🌸)\n\n⚠️ Escribe el mensaje usando broches como `{usuario}`, `{grupo}`, `{miembros}`.\n*Uso:* `!setwelcome ¡Hola {usuario} a {grupo}!`'
            }, { quoted: m });
        }

        // Asegurar que el grupo exista en la tabla y actualizar el texto de bienvenida
        db.getSafeGroup(jid, (err) => {
            if (err) {
                return sock.sendMessage(jid, { text: '⚠️ Error al acceder a la base de datos del grupo.' }, { quoted: m });
            }

            db.run(`UPDATE group_settings SET welcome_text = ?, welcome_enabled = 1 WHERE group_jid = ?`, [mensaje, jid], async (err2) => {
                if (err2) {
                    console.error('Error al actualizar welcome_text:', err2.message);
                    return sock.sendMessage(jid, { text: '⚠️ Error al guardar el mensaje de bienvenida.' }, { quoted: m });
                }

                await sock.sendMessage(jid, {
                    text: '(「✿」 "BIENVENIDA GUARDADA"🌸)\n\n✅ El mensaje personalizado de bienvenida ha sido actualizado y activado con éxito.'
                }, { quoted: m });
            });
        });
    }
};
