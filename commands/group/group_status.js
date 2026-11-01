module.exports = {
    name: 'close',
    aliases: [],
    category: 'grupo',
    description: 'Abre o cierra el grupo para que solo los admins puedan escribir.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;

        if (!jid.endsWith('@g.us')) {
            return await sock.sendMessage(jid, { text: '❌ Este comando solo se puede usar en grupos.' }, { quoted: m });
        }

        const body = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const commandUsed = body.slice(1).trim().split(/ +/)[0].toLowerCase();

        try {
            if (['close', 'cerrar'].includes(commandUsed)) {
                // 'announcement' restringe para que solo los admins envíen mensajes
                await sock.groupSettingUpdate(jid, 'announcement');
                await sock.sendMessage(jid, { text: '🔒 Grupo cerrado. Ahora solo los administradores pueden enviar mensajes.' }, { quoted: m });
            } else if (['open', 'abrir'].includes(commandUsed)) {
                // 'not_announcement' permite que todos envíen mensajes
                await sock.groupSettingUpdate(jid, 'not_announcement');
                await sock.sendMessage(jid, { text: '🔓 Grupo abierto. Todos los miembros pueden enviar mensajes de nuevo.' }, { quoted: m });
            }
        } catch (err) {
            console.error('❌ Error al cambiar estado del grupo:', err);
            await sock.sendMessage(jid, { text: '❌ Ocurrió un error. Asegúrate de que el bot tenga permisos de administrador en el grupo.' }, { quoted: m });
        }
    }
};