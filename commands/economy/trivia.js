module.exports = {
    name: 'trivia',
    category: 'economy',
    description: 'Responde una pregunta de cultura general.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const text = `(「✿」 "TRIVIA DE CULTURA"🌸)\n\n` +
                     `❓ ¿Cuál es el planeta más grande del sistema solar?\n\n` +
                     `a) Saturno\n` +
                     `b) Júpiter\n` +
                     `c) Neptuno\n` +
                     `d) Marte\n\n` +
                     `💡 Escribe \`!trivia b\` para responder.`;

        await sock.sendMessage(jid, { text }, { quoted: m });
    }
};
