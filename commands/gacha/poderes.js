module.exports = {
    name: 'poderes',
    aliases: ['powers', 'habilidades'],
    category: 'gacha',
    description: 'Muestra los poderes y estadísticas de un personaje.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const categoria = args[0]?.toLowerCase();
        const id = args[1];

        if (!categoria || !id) {
            return await sock.sendMessage(jid, {
                text: '(「✿」 "FICHA DE HABILIDADES"🌸)\n\n⚠️ Indica la categoría y el ID.\n*Uso:* `!poderes <categoría> <ID>`'
            }, { quoted: m });
        }

        const text = `(「✿」 "PODERES DE ${id.toUpperCase()}"🌸)\n\n` +
                     `📂 *Categoría:* ${categoria}\n` +
                     `❤️ *Vida (HP):* 1,450\n` +
                     `⚔️ *Ataque:* 320 | 🛡️ *Defensa:* 210\n` +
                     `✨ *Habilidad Especial:* Golpe Crítico Elemental (180% de daño)`;

        await sock.sendMessage(jid, { text }, { quoted: m });
    }
};
