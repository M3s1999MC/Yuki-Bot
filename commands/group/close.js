// close.js
module.exports = {
    name: 'close',
    aliases: ['cerrar'],
    adminOnly: true,
    botAdminOnly: true,
    category: 'group',
    description: 'Cierra el grupo para que solo los admins envíen mensajes.',
    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        if (!jid.endsWith('@g.us')) return;
        try {
            await sock.groupSettingUpdate(jid, 'announcement');
            await sock.sendMessage(jid, { text: '🔒 El grupo ha sido cerrado. Solo los administradores pueden enviar mensajes.' }, { quoted: m });
        } catch {
            await sock.sendMessage(jid, { text: '❌ Error al cerrar el grupo. Asegúrate de que el bot sea admin.' }, { quoted: m });
        }
    }
};