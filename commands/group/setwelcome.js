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

        // 1. Asegurar que la tabla exista con PRIMARY KEY en jid
        db.run(`CREATE TABLE IF NOT EXISTS group_settings (
            jid TEXT PRIMARY KEY, 
            welcome_message TEXT, 
            bye_message TEXT
        )`, (err) => {
            if (err) {
                console.error("Error creando tabla:", err);
                return sock.sendMessage(jid, { text: '⚠️ Error al inicializar la tabla en la base de datos.' }, { quoted: m });
            }

            // 2. Verificar si ya existe un registro para este grupo
            db.get(`SELECT jid FROM group_settings WHERE jid = ?`, [jid], (err2, row) => {
                if (err2) {
                    console.error("Error consultando grupo:", err2);
                    return sock.sendMessage(jid, { text: '⚠️ Error al consultar la base de datos.' }, { quoted: m });
                }

                if (row) {
                    // Si ya existe, hacemos UPDATE
                    db.run(`UPDATE group_settings SET welcome_message = ? WHERE jid = ?`, [mensaje, jid], async (err3) => {
                        if (err3) {
                            console.error("Error en update:", err3);
                            return sock.sendMessage(jid, { text: '⚠️ Error al actualizar el mensaje.' }, { quoted: m });
                        }
                        await confirmarExito(sock, jid, m);
                    });
                } else {
                    // Si no existe, hacemos INSERT limpio
                    db.run(`INSERT INTO group_settings (jid, welcome_message) VALUES (?, ?)`, [jid, mensaje], async (err3) => {
                        if (err3) {
                            console.error("Error en insert:", err3);
                            return sock.sendMessage(jid, { text: '⚠️ Error al insertar el mensaje.' }, { quoted: m });
                        }
                        await confirmarExito(sock, jid, m);
                    });
                }
            });
        });
    }
};

async function confirmarExito(sock, jid, m) {
    await sock.sendMessage(jid, {
        text: ' 「✿」 "BIENVENIDA GUARDADA"🌸 \n\n✅ El mensaje personalizado de bienvenida ha sido actualizado con éxito.'
    }, { quoted: m });
}
