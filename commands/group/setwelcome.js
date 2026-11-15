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

        // Asegurar que la base de datos y el chat existan sin machacar propiedades previas
        if (!global.db.data) global.db.data = { users: {}, chats: {}, stats: {}, msgs: {}, sticker: {}, settings: {} };
        if (!global.db.data.chats) global.db.data.chats = {};
        if (!global.db.data.chats[jid]) {
            global.db.data.chats[jid] = {};
        }

        // Guardar el mensaje exactamente en la propiedad que lee testwelcome
        global.db.data.chats[jid].welcomeMessage = mensaje;

        // Si tu base de datos requiere escritura manual (como Lowdb), descomenta la siguiente línea:
        // if (typeof global.db.write === 'function') await global.db.write();

        await sock.sendMessage(jid, {
            text: ' 「✿」 "BIENVENIDA GUARDADA"🌸 \n\n✅ El mensaje personalizado de bienvenida ha sido actualizado con éxito.'
        }, { quoted: m });
    }
};
