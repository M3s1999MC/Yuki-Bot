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

        // 2. Orihime reacciona diferente según su velocidad
        let reaccion = '¡Súper rapidita! Estoy lista para jugar contigo~ ✨';
        if (latency > 500) {
            reaccion = '¡Ay, me tropecé un poquito! Dame un segundito~ 💦';
        } else if (latency > 200) {
            reaccion = 'Voy a buen ritmito, ¡no me dejes solita! ♡';
        }

        // 3. Mensaje llamativo con toda la identidad de Yuki / Orihime
        const text = [
            '🌸 ˚୨୧⋆｡˚ ⋆ *¡PONG!* ⋆ ˚｡⋆୨୧˚ 🌸',
            `🍡 _${reaccion}_`,
            '',
            `✦ *Velocidad:* ${latency}ms`,
            '✦ *Estado:* ¡Despierta y con energía! ♡',
            '',
            '━━━━━━━━━━ 🌸 ━━━━━━━━━━',
            '_Con amor, Orihime 🌸_'
        ].join('\n');

        await sock.sendMessage(jid, { text }, { quoted: m });
    }
};
