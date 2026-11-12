module.exports = {
    name: 'ban',
    aliases: ['silenciar', 'mute'],
    category: 'groups',
    description: 'Silencia a un usuario: el bot borra todo lo que escriba.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const targetUser = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

        if (!targetUser) {
            return await sock.sendMessage(jid, {
                text: '(「✿」 "MODO SILENCIO"🌸)\n\n⚠️ Debes mencionar al usuario que deseas silenciar.'
            }, { quoted: m });
        }

        await sock.sendMessage(jid, {
            text: `(「✿」 "USUARIO SILENCIADO"🌸)\n\n🔇 El usuario @${targetUser.split('@')[0]} ha sido silenciado en este grupo.`,
            mentions: [targetUser]
        }, { quoted: m });
    }
};
