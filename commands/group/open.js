// open.js
module.exports = {
    name: 'open',
    aliases: ['abrir'],
    adminOnly: true,
    botAdminOnly: true,
    category: 'group',
    description: 'Abre el grupo para todos.',
    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        if (!jid.endsWith('@g.us')) return;
        try {
            await sock.groupSettingUpdate(jid, 'not_announcement');
            await sock.sendMessage(jid, { text: '🔓 El grupo ha sido abierto. Todos pueden enviar mensajes.' }, { quoted: m });
        } catch {
            await sock.sendMessage(jid, { text: '❌ Error al abrir el grupo.' }, { quoted: m });
        }
    }
};