module.exports = {
    name: 'banbot',
    aliases: ['bloquearbot'],
    category: 'groups',
    description: 'Impide que un usuario use el bot en este grupo.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const targetUser = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

        if (!targetUser) {
            return await sock.sendMessage(jid, {
                text: '(「✿」 "BLOQUEO DE BOT"🌸)\n\n⚠️ Debes mencionar al usuario que deseas bloquear del bot.'
            }, { quoted: m });
        }

        await sock.sendMessage(jid, {
            text: `(「✿」 "USUARIO BLOQUEADO DEL BOT"🌸)\n\n🚫 El usuario @${targetUser.split('@')[0]} ya no podrá utilizar los comandos de YukiBot en este grupo.`,
            mentions: [targetUser]
        }, { quoted: m });
    }
};
