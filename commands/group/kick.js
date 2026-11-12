module.exports = {
    name: 'kick',
    aliases: ['expulsar'],
    category: 'groups',
    description: 'Elimina a un usuario del grupo.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const targetUser = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

        if (!targetUser) {
            return await sock.sendMessage(jid, {
                text: '(「✿」 "EXPULSIÓN DE MIEMBRO"🌸)\n\n⚠️ Debes mencionar al usuario que será expulsado.'
            }, { quoted: m });
        }

        await sock.sendMessage(jid, {
            text: `(「✿」 "MIEMBRO EXPULSADO"🌸)\n\n🚪 El usuario @${targetUser.split('@')[0]} fue expulsado del grupo.`,
            mentions: [targetUser]
        }, { quoted: m });
    }
};
