module.exports = {
    name: 'goodbye',
    aliases: ['despedida'],
    category: 'groups',
    description: 'Activa o desactiva la despedida del grupo.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const estado = args[0]?.toLowerCase();

        if (!['on', 'off'].includes(estado)) {
            return await sock.sendMessage(jid, { text: '(「✿」 "SISTEMA DE DESPEDIDA"🌸)\n\n⚠️ Uso: `!goodbye on` o `!goodbye off`' });
        }

        await sock.sendMessage(jid, { text: `(「✿」 "DESPEDIDA ACTUALIZADA"🌸)\n\n👋 Mensajes de despedida: *${estado.toUpperCase()}*.` });
    }
};
