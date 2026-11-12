module.exports = {
    name: 'promote',
    aliases: ['promover', 'promete'],
    category: 'groups',
    description: 'Da admin a un miembro del grupo.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const targetUser = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

        if (!targetUser) return sock.sendMessage(jid, { text: '(「✿」 "ASCENSO A ADMIN"🌸)\n\n⚠️ Menciona al usuario.' });

        await sock.sendMessage(jid, { text: `(「✿」 "NUEVO ADMINISTRADOR"🌸)\n\n👑 ¡Felicidades @${targetUser.split('@')[0]}, ahora eres administrador!`, mentions: [targetUser] });
    }
};
