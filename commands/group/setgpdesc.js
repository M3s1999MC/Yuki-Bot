// setgpdesc.js
module.exports = {
    name: 'setgpdesc',
    aliases: ['descripciongrupo', 'setdescripciongrupo'],
    adminOnly: true,
    botAdminOnly: true,
    category: 'group',
    description: 'Cambia la descripción del grupo.',
    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        if (!jid.endsWith('@g.us')) return;
        const newDesc = args.join(' ');
        if (!newDesc) return await sock.sendMessage(jid, { text: '❌ Escribe la nueva descripción.' }, { quoted: m });
        try {
            await sock.groupUpdateDescription(jid, newDesc);
            await sock.sendMessage(jid, { text: '✅ Descripción del grupo actualizada.' }, { quoted: m });
        } catch {
            await sock.sendMessage(jid, { text: '❌ Error al actualizar la descripción.' }, { quoted: m });
        }
    }
};