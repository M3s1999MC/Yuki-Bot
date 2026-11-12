module.exports = {
    name: 'tag',
    aliases: ['hidetag', 'todos'],
    category: 'groups',
    description: 'Menciona a todos los miembros de forma oculta.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const mensaje = args.join(' ') || '¡Atención a todos!';

        await sock.sendMessage(jid, {
            text: `(「✿」 "AVISO GENERAL"🌸)\n\n📢 ${mensaje}`
        });
    }
};
