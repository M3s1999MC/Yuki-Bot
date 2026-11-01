module.exports = {
    name: 'promote',
    aliases: ['promover', 'admin', 'demote', 'degradar'],
    adminOnly: true,
    botAdminOnly: true,
    category: 'group',
    description: 'Asciende o desciende a un usuario como administrador del grupo.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        if (!jid.endsWith('@g.us')) {
            return await sock.sendMessage(jid, { text: '⚠️ Este comando solo se puede usar en grupos.' }, { quoted: m });
        }

        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        const target = quoted ? quoted.participant || m.message.extendedTextMessage.contextInfo.participant : (mentioned ? mentioned[0] : null);

        if (!target) {
            return await sock.sendMessage(jid, { text: '⚠️ Debes mencionar o responder al mensaje del usuario.' }, { quoted: m });
        }

        const isDemote = m.text?.toLowerCase().includes('demote') || m.text?.toLowerCase().includes('degradar');

        try {
            if (isDemote) {
                await sock.groupParticipantsUpdate(jid, [target], 'demote');
                await sock.sendMessage(jid, { text: '📉 Usuario descendido de administrador correctamente.' }, { quoted: m });
            } else {
                await sock.groupParticipantsUpdate(jid, [target], 'promote');
                await sock.sendMessage(jid, { text: '📈 ¡Usuario ascendido a administrador con éxito!' }, { quoted: m });
            }
        } catch (err) {
            console.error(err);
            await sock.sendMessage(jid, { text: '❌ No se pudo cambiar el rol. Asegúrate de que el bot sea administrador.' }, { quoted: m });
        }
    }
};