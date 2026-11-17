module.exports = {
    name: 'ping',
    aliases: ['p'],
    category: 'general',
    description: 'Reacciona con 🏓 y muestra el ping de Yuki.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const start = Date.now();

        // 1. Reacciona al mensaje con el palito de ping pong
        await sock.sendMessage(jid, {
            react: {
                text: '🏓',
                key: m.key
            }
        });

        const latency = Date.now() - start;

        // 2. Manda el texto con la identidad de Yuki
        await sock.sendMessage(jid, {
            text: `⋆ . .̷ ׅ⏜ׅ ⌢\n「✿」 Ping de Yuki:\n\n⭐ Latencia: *${latency}ms*`
        }, { quoted: m });
    }
};