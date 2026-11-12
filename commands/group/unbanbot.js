module.exports = {
    name: 'unbanbot',
    aliases: ['desbloquearbot'],
    category: 'groups',
    description: 'Devuelve el acceso al bot a un usuario en este grupo.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const targetUser = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

        if (!targetUser) {
            return await sock.sendMessage(jid, {
                text: '(「✿」 "ACCESO AL BOT"🌸)\n\n⚠️ Debes mencionar al usuario para devolverle el acceso.'
            }, { quoted: m });
        }

        await sock.sendMessage(jid, {
            text: `(「✿」 "ACCESO RESTAURADO"🌸)\n\n✅ El usuario @${targetUser.split('@')[0]} puede volver a usar los comandos de YukiBot.`,
            mentions: [targetUser]
        }, { quoted: m });
    }
};
