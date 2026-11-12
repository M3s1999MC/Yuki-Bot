module.exports = {
    name: 'rob',
    aliases: ['robar'],
    category: 'economy',
    description: 'Intenta robarle a otro usuario.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const targetUser = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

        if (!targetUser) {
            return await sock.sendMessage(jid, { text: '(「✿」 "INTENTO DE ROBO"🌸)\n\n⚠️ Debes mencionar al usuario que deseas robar.' }, { quoted: m });
        }

        const exito = Math.random() > 0.55;
        if (exito) {
            const robado = 1500;
            await sock.sendMessage(jid, { text: `(「✿」 "ROBO EXITOSO"🌸)\n\n🦹‍♂️ Le hurtaste *¥${robado.toLocaleString()}* a @${targetUser.split('@')[0]}.`, mentions: [targetUser] }, { quoted: m });
        } else {
            await sock.sendMessage(jid, { text: `(「✿」 "¡ATRAPADO!"🌸)\n\n🚨 @${targetUser.split('@')[0]} te descubrió y pagaste multa.`, mentions: [targetUser] }, { quoted: m });
        }
    }
};
