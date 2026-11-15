const db = require('../../database/db');

module.exports = {
    name: 'setwelcome',
    category: 'groups',
    description: 'Edita el mensaje de bienvenida con broches (usuario, grupo, miembros, etc.).',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const mensaje = args.join(' ');

        if (!mensaje) {
            return await sock.sendMessage(jid, {
                text: ' 「✿」 "CONFIGURAR BIENVENIDA"🌸 \n\n⚠️ Escribe el mensaje usando broches como `{usuario}`, `{grupo}`, `{miembros}`.\n*Uso:* `!setwelcome ¡Hola {usuario} a {grupo}!`'
            }, { quoted: m });
        }

        // Crear la tabla si no existe para asegurar que guarde sin errores
        db.run(`CREATE TABLE IF NOT EXISTS group_settings (jid TEXT PRIMARY KEY, welcome_message TEXT)`, (err) => {
            if (err) {
                console.error(err);
                return sock.sendMessage(jid, { text: '⚠️ Error al conectar con la base de datos.' }, { quoted: m });
            }

            // Insertar o actualizar el mensaje de bienvenida del grupo
            db.run(`INSERT INTO group_settings (jid, welcome_message) VALUES (?, ?) 
                    ON CONFLICT(jid) DO UPDATE SET welcome_message = ?`, 
                    [jid, mensaje, mensaje], async (err2) => {
                if (err2) {
                    console.error(err2);
                    return sock.sendMessage(jid, { text: '⚠️ Error al guardar el mensaje en la base de datos.' }, { quoted: m });
                }

                await sock.sendMessage(jid, {
                    text: ' 「✿」 "BIENVENIDA GUARDADA"🌸 \n\n✅ El mensaje personalizado de bienvenida ha sido actualizado con éxito.'
                }, { quoted: m });
            });
        });
    }
};
