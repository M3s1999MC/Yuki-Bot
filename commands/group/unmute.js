module.exports = {
    name: 'unban',
    aliases: ['desilenciar', 'unmute'],
    category: 'groups',
    description: 'Quita el silencio a un usuario en el grupo.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const targetUser = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

        if (!targetUser) {
            return await sock.sendMessage(jid, {
                text: '(「✿」 "QUITAR SILENCIO"🌸)\n\n⚠️ Debes mencionar al usuario para desilenciarlo.'
            }, { quoted: m });
        }

        await sock.sendMessage(jid, {
            text: `(「✿」 "SILENCIO RETIRADO"🌸)\n\n🔊 El usuario @${targetUser.split('@')[0]} ya puede hablar con normalidad.`,
            mentions: [targetUser]
        }, { quoted: m });
    }
};
