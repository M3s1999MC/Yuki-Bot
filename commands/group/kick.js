module.exports = {
    name: 'kick',
    aliases: ['ban', 'bang', 'expulsar'],
    adminOnly: true,
    botAdminOnly: true,
    category: 'group',
    description: 'Expulsa a un usuario del grupo.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        if (!jid.endsWith('@g.us')) {
            return await sock.sendMessage(jid, { text: '⚠️ Este comando solo se puede usar en grupos.' }, { quoted: m });
        }

        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        const target = quoted ? quoted.participant || m.message.extendedTextMessage.contextInfo.participant : (mentioned ? mentioned[0] : null);

        if (!target) {
            return await sock.sendMessage(jid, { text: '⚠️ Debes mencionar o responder al usuario que deseas expulsar.' }, { quoted: m });
        }

        try {
            await sock.groupParticipantsUpdate(jid, [target], 'remove');
            await sock.sendMessage(jid, { text: '👢 Usuario expulsado del grupo correctamente.' }, { quoted: m });
        } catch (err) {
            console.error(err);
            await sock.sendMessage(jid, { text: '❌ No se pudo expulsar al usuario. Verifica que el bot tenga permisos de administrador.' }, { quoted: m });
        }
    }
};