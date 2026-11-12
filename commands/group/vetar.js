module.exports = {
    name: 'vetar',
    aliases: ['banpermanente'],
    category: 'groups',
    description: 'Expulsa a un usuario y lo saca de nuevo si intenta volver a entrar.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const targetUser = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

        if (!targetUser) {
            return await sock.sendMessage(jid, {
                text: '(「✿」 "VETO PERMANENTE"🌸)\n\n⚠️ Debes mencionar al usuario que será vetado del grupo.'
            }, { quoted: m });
        }

        await sock.sendMessage(jid, {
            text: `(「✿」 "USUARIO VETADO"🌸)\n\n🛑 El usuario @${targetUser.split('@')[0]} ha sido vetado permanentemente de este grupo.`,
            mentions: [targetUser]
        }, { quoted: m });
    }
};
