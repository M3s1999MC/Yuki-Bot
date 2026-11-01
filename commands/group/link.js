module.exports = {
    name: 'link',
    aliases: ['enlace', 'invite'],
    category: 'group',
    description: 'Obtiene el enlace de invitación del grupo.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        if (!jid.endsWith('@g.us')) {
            return await sock.sendMessage(jid, { text: '⚠️ Este comando solo se puede usar en grupos.' }, { quoted: m });
        }

        try {
            const code = await sock.groupInviteCode(jid);
            await sock.sendMessage(jid, { text: `🔗 **Enlace de invitación del grupo:**\nhttps://chat.whatsapp.com/${code}` }, { quoted: m });
        } catch (err) {
            console.error(err);
            await sock.sendMessage(jid, { text: '❌ No se pudo obtener el enlace. Asegúrate de que el bot sea administrador.' }, { quoted: m });
        }
    }
};