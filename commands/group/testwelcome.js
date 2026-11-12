module.exports = {
    name: 'testwelcome',
    category: 'groups',
    description: 'Prueba la bienvenida con tu usuario.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || jid;

        await sock.sendMessage(jid, {
            text: `(「✿」 "PRUEBA DE BIENVENIDA"🌸)\n\n👋 ¡Bienvenido/a @${sender.split('@')[0]} a este grupo de prueba!`,
            mentions: [sender]
        }, { quoted: m });
    }
};
