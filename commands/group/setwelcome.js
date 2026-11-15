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

        // Inserción o reemplazo directo
        db.run(`INSERT OR REPLACE INTO group_settings (jid, welcome_message, bye_message) 
                VALUES (?, ?, (SELECT bye_message FROM group_settings WHERE jid = ?))`, 
                [jid, mensaje, jid], async (err) => {
            if (err) {
                console.error("Error al guardar bienvenida:", err);
                return sock.sendMessage(jid, { text: `⚠️ Error al guardar: ${err.message}` }, { quoted: m });
            }

            await sock.sendMessage(jid, {
                text: ' 「✿」 "BIENVENIDA GUARDADA"🌸 \n\n✅ El mensaje personalizado de bienvenida ha sido actualizado con éxito.'
            }, { quoted: m });
        });
    }
};
