module.exports = {
    name: 'add',
    aliases: ['agregar'],
    category: 'groups',
    description: 'Añadir a un usuario al grupo.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const numero = args[0] || m.message.extendedTextMessage?.contextInfo?.participant;

        if (!numero) {
            return await sock.sendMessage(jid, {
                text: '(「✿」 "ADMINISTRACIÓN - AÑADIR"🌸)\n\n⚠️ Indica el número o responde al mensaje de la persona que deseas agregar.'
            }, { quoted: m });
        }

        await sock.sendMessage(jid, {
            text: `(「✿」 "USUARIO AÑADIDO"🌸)\n\n👥 Se ha intentado añadir a \`${numero}\` al grupo.`
        }, { quoted: m });
    }
};
