module.exports = {
    name: 'unvetar',
    aliases: ['perdonar'],
    category: 'groups',
    description: 'Quita el veto: el usuario ya puede volver a entrar al grupo.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const targetUser = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

        if (!targetUser) {
            return await sock.sendMessage(jid, {
                text: '(「✿」 "RETIRAR VETO"🌸)\n\n⚠️ Debes mencionar al usuario que deseas perdonar.'
            }, { quoted: m });
        }

        await sock.sendMessage(jid, {
            text: `(「✿」 "VETO LEVANTADO"🌸)\n\n✨ El veto sobre @${targetUser.split('@')[0]} ha sido retirado. Ya puede unirse de nuevo.`,
            mentions: [targetUser]
        }, { quoted: m });
    }
};
