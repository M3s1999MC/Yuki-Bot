module.exports = {
    name: 'welcome',
    aliases: ['bienvenida'],
    category: 'groups',
    description: 'Activa o desactiva la bienvenida del grupo.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const estado = args[0]?.toLowerCase();

        if (!['on', 'off'].includes(estado)) {
            return await sock.sendMessage(jid, { text: '(「✿」 "SISTEMA DE BIENVENIDA"🌸)\n\n⚠️ Uso: `!welcome on` o `!welcome off`' });
        }

        await sock.sendMessage(jid, { text: `(「✿」 "BIENVENIDA ACTUALIZADA"🌸)\n\n✨ Mensajes de bienvenida: *${estado.toUpperCase()}*.` });
    }
};
