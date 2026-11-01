module.exports = {
    name: 'groupcontrol',
    aliases: [],
    category: 'group',
    description: 'Abre o cierra el grupo para mensajes.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        if (!jid.endsWith('@g.us')) {
            return await sock.sendMessage(jid, { text: '⚠️ Este comando solo se puede usar en grupos.' }, { quoted: m });
        }

        const isClose = m.text?.toLowerCase().includes('close') || m.text?.toLowerCase().includes('cerrar');

        try {
            await sock.groupSettingUpdate(jid, isClose ? 'announcement' : 'not_announcement');
            await sock.sendMessage(jid, { text: isClose ? '🔒 El grupo ha sido cerrado. Solo los administradores pueden enviar mensajes.' : '🔓 El grupo ha sido abierto. Todos los miembros pueden enviar mensajes.' }, { quoted: m });
        } catch (err) {
            console.error(err);
            await sock.sendMessage(jid, { text: '❌ No se pudo cambiar la configuración del grupo.' }, { quoted: m });
        }
    }
};