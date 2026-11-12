module.exports = {
    name: 'setdesc',
    aliases: ['setdec', 'setdescripcion'],
    category: 'groups',
    description: 'Cambiar la descripción del grupo.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const nuevaDesc = args.join(' ');

        if (!nuevaDesc) {
            return await sock.sendMessage(jid, { text: '(「✿」 "DESCRIPCIÓN DE GRUPO"🌸)\n\n⚠️ Escribe la nueva descripción.\n*Uso:* `!setdesc <texto>`' });
        }

        await sock.sendMessage(jid, { text: '(「✿」 "DESCRIPCIÓN ACTUALIZADA"🌸)\n\n📋 La descripción del grupo ha sido modificada con éxito.' });
    }
};
