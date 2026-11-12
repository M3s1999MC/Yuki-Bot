module.exports = {
    name: 'mispokemon',
    category: 'gacha',
    description: 'Muestra tu Pokédex con tus Pokémon y su nivel.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || jid;
        const pagina = parseInt(args[0]) || 1;

        const text = `(「✿」 "POKÉDEX PERSONAL - PÁG. ${pagina}"🌸)\n\n` +
                     `👤 *Entrenador:* @${sender.split('@')[0]}\n\n` +
                     `1. \`[PK-025]\` **Pikachu** — Nvl. 12\n` +
                     `2. \`[PK-006]\` **Charizard** — Nvl. 20`;

        await sock.sendMessage(jid, { text, mentions: [sender] }, { quoted: m });
    }
};
