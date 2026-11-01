// setgpname.js
module.exports = {
    name: 'setgpname',
    aliases: ['nombregrupo', 'setnombregrupo'],
    adminOnly: true,
    botAdminOnly: true,
    category: 'group',
    description: 'Cambia el nombre del grupo.',
    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        if (!jid.endsWith('@g.us')) return;
        const newName = args.join(' ');
        if (!newName) return await sock.sendMessage(jid, { text: '❌ Escribe el nuevo nombre del grupo.' }, { quoted: m });
        try {
            await sock.groupUpdateSubject(jid, newName);
            await sock.sendMessage(jid, { text: '✅ Nombre del grupo actualizado.' }, { quoted: m });
        } catch {
            await sock.sendMessage(jid, { text: '❌ Error al actualizar el nombre.' }, { quoted: m });
        }
    }
};