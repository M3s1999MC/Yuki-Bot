module.exports = {
    name: 'testbye',
    category: 'groups',
    description: 'Prueba la despedida con tu usuario.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || jid;

        await sock.sendMessage(jid, {
            text: `(「✿」 "PRUEBA DE DESPEDIDA"🌸)\n\n🚪 Adiós @${sender.split('@')[0]}, esperamos que vuelvas pronto.`,
            mentions: [sender]
        }, { quoted: m });
    }
};
