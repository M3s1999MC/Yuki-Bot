module.exports = {
    name: 'revoke',
    aliases: ['restablecer'],
    category: 'group',
    description: 'Restablece el enlace de invitación del grupo.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        if (!jid.endsWith('@g.us')) {
            return await sock.sendMessage(jid, { text: '⚠️ Este comando solo se puede usar en grupos.' }, { quoted: m });
        }

        try {
            const code = await sock.groupRevokeInvite(jid);
            await sock.sendMessage(jid, { text: `🔗 ¡Enlace de invitación restablecido con éxito!\nNuevo código: ${code}` }, { quoted: m });
        } catch (err) {
            console.error(err);
            await sock.sendMessage(jid, { text: '❌ No se pudo restablecer el enlace. Asegúrate de que el bot sea administrador.' }, { quoted: m });
        }
    }
};