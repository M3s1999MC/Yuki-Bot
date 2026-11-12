module.exports = {
    name: 'namegp',
    aliases: ['nombregp'],
    category: 'groups',
    description: 'Cambiar el nombre del grupo.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const nuevoNombre = args.join(' ');

        if (!nuevoNombre) {
            return await sock.sendMessage(jid, { text: '(「✿」 "NOMBRE DE GRUPO"🌸)\n\n⚠️ Escribe el nuevo nombre.\n*Uso:* `!namegp <nuevo nombre>`' });
        }

        await sock.sendMessage(jid, { text: `(「✿」 "NOMBRE ACTUALIZADO"🌸)\n\n📝 El nombre del grupo ha sido cambiado a: *${nuevoNombre}*.` });
    }
};
