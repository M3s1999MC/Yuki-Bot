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

        // Inserción o reemplazo directo
        db.run(`INSERT OR REPLACE INTO group_settings (jid, welcome_message, bye_message) 
                VALUES (?, (SELECT welcome_message FROM group_settings WHERE jid = ?), ?)`, 
                [jid, jid, mensaje], async (err) => {
            if (err) {
                console.error("Error al guardar despedida:", err);
                return sock.sendMessage(jid, { text: `⚠️ Error al guardar: ${err.message}` }, { quoted: m });
            }

            await sock.sendMessage(jid, {
                text: '「✿」 "DESPEDIDA GUARDADA"🌸 \n\n✅ El mensaje personalizado de despedida ha sido actualizado con éxito.'
            }, { quoted: m });
        });
    }
};
