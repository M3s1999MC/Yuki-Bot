module.exports = {
    name: 'misbrawlers',
    category: 'gacha',
    description: 'Muestra tus Brawlers con su nivel.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || jid;
        const pagina = parseInt(args[0]) || 1;

        const text = `(「✿」 "COLECCIÓN DE BRAWLERS - PÁG. ${pagina}"🌸)\n\n` +
                     `👤 *Dueño:* @${sender.split('@')[0]}\n\n` +
                     `1. \`[BS-001]\` **Shelly** — Nvl. 10\n` +
                     `2. \`[BS-012]\` **Spike** — Nvl. 7`;

        await sock.sendMessage(jid, { text, mentions: [sender] }, { quoted: m });
    }
};
