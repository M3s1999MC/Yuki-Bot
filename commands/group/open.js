module.exports = {
    name: 'open',
    aliases: ['abrir'],
    category: 'groups',
    description: 'Abre el grupo para que todos puedan escribir.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        await sock.sendMessage(jid, { text: '(「✿」 "ESTADO DEL GRUPO"🌸)\n\n🔓 El grupo ha sido abierto. ¡Todos los miembros pueden enviar mensajes!' });
    }
};
