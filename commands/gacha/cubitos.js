module.exports = {
    name: 'cubitos',
    aliases: ['cubitosdefuerza'],
    category: 'gacha',
    description: 'Muestra la tienda de cubitos de fuerza para Brawlers.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const text = `(「✿」 "TIENDA DE CUBITOS DE FUERZA"🌸)\n\n` +
                     `💎 Cubito de Poder Individual - ¥2,000 c/u\n\n` +
                     `💡 *Uso:* \`!comprarcubitos <cantidad>\``;

        await sock.sendMessage(jid, { text }, { quoted: m });
    }
};
