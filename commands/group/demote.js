module.exports = {
    name: 'demote',
    aliases: ['demo', 'degradar'],
    category: 'groups',
    description: 'Quita el admin a un miembro del grupo.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const targetUser = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

        if (!targetUser) return sock.sendMessage(jid, { text: '(「✿」 "DEGRADACIÓN"🌸)\n\n⚠️ Menciona al administrador.' });

        await sock.sendMessage(jid, { text: `(「✿」 "ADMINISTRADOR RETIRADO"🌸)\n\n📉 @${targetUser.split('@')[0]} ya no es administrador.`, mentions: [targetUser] });
    }
};
