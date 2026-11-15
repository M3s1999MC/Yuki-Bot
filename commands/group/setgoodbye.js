const db = require('../../database/db');

module.exports = {
    name: 'setbye',
    category: 'groups',
    description: 'Edita el mensaje de despedida con broches (usuario, grupo, miembros, etc.).',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const mensaje = args.join(' ');

        if (!mensaje) {
            return await sock.sendMessage(jid, {
                text: '(「✿」 "CONFIGURAR DESPEDIDA"🌸)\n\n⚠️ Escribe el mensaje usando broches como `{usuario}`, `{grupo}`, `{miembros}`.\n*Uso:* `!setbye ¡Adiós {usuario} de {grupo}!`'
            }, { quoted: m });
        }

        // Asegurar que la tabla y la columna existan
        db.run(`CREATE TABLE IF NOT EXISTS group_settings (jid TEXT PRIMARY KEY, welcome_message TEXT, bye_message TEXT)`, (err) => {
            if (err) {
                console.error(err);
                return sock.sendMessage(jid, { text: '⚠️ Error al conectar con la base de datos.' }, { quoted: m });
            }

            // Insertar o actualizar el mensaje de despedida del grupo
            db.run(`INSERT INTO group_settings (jid, bye_message) VALUES (?, ?) 
                    ON CONFLICT(jid) DO UPDATE SET bye_message = ?`, 
                    [jid, mensaje, mensaje], async (err2) => {
                if (err2) {
                    console.error(err2);
                    return sock.sendMessage(jid, { text: '⚠️ Error al guardar el mensaje de despedida.' }, { quoted: m });
                }

                await sock.sendMessage(jid, {
                    text: '(「✿」 "DESPEDIDA GUARDADA"🌸)\n\n✅ El mensaje personalizado de despedida ha sido actualizado con éxito.'
                }, { quoted: m });
            });
        });
    }
};
