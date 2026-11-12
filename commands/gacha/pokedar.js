module.exports = {
    name: 'pokedar',
    aliases: ['pokealimentar'],
    category: 'gacha',
    description: 'Da de comer a un Pokémon para subirlo de nivel.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const [num, id] = args;

        if (!num || !id) return sock.sendMessage(jid, { text: '(「✿」 "ALIMENTAR POKÉMON"🌸)\n\n⚠️ Uso: `!pokedar <número> <ID>`' }, { quoted: m });

        await sock.sendMessage(jid, {
            text: `(「✿」 "¡NIVEL AUMENTADO!"🌸)\n\n✨ Alimentaste al Pokémon \`${id}\` y subió de nivel.`
        }, { quoted: m });
    }
};
