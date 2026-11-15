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
                text: ' 「✿」 "CONFIGURAR DESPEDIDA"🌸 \n\n⚠️ Escribe el mensaje usando broches como `{usuario}`, `{grupo}`, `{miembros}`.\n*Uso:* `!setbye ¡Adiós {usuario} de {grupo}!`'
            }, { quoted: m });
        }

        db.run(`CREATE TABLE IF NOT EXISTS group_settings (
            jid TEXT PRIMARY KEY, 
            welcome_message TEXT, 
            bye_message TEXT
        )`, (err) => {
            if (err) return sock.sendMessage(jid, { text: '⚠️ Error al conectar con la base de datos.' }, { quoted: m });

            db.get(`SELECT jid FROM group_settings WHERE jid = ?`, [jid], (err2, row) => {
                if (err2) return sock.sendMessage(jid, { text: '⚠️ Error al consultar la base de datos.' }, { quoted: m });

                if (row) {
                    db.run(`UPDATE group_settings SET bye_message = ? WHERE jid = ?`, [mensaje, jid], async (err3) => {
                        if (err3) return sock.sendMessage(jid, { text: '⚠️ Error al actualizar el mensaje.' }, { quoted: m });
                        await confirmarBye(sock, jid, m);
                    });
                } else {
                    db.run(`INSERT INTO group_settings (jid, bye_message) VALUES (?, ?)`, [jid, mensaje], async (err3) => {
                        if (err3) return sock.sendMessage(jid, { text: '⚠️ Error al insertar el mensaje.' }, { quoted: m });
                        await confirmarBye(sock, jid, m);
                    });
                }
            });
        });
    }
};

async function confirmarBye(sock, jid, m) {
    await sock.sendMessage(jid, {
        text: ' 「✿」 "DESPEDIDA GUARDADA"🌸 \n\n✅ El mensaje personalizado de despedida ha sido actualizado con éxito.'
    }, { quoted: m });
}
