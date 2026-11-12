module.exports = {
    name: 'misdragones',
    category: 'gacha',
    description: 'Muestra tus dragones con su nivel.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || jid;
        const pagina = parseInt(args[0]) || 1;

        const text = `(「✿」 "ISLA DE DRAGONES - PÁG. ${pagina}"🌸)\n\n` +
                     `👤 *Dueño:* @${sender.split('@')[0]}\n\n` +
                     `1. \`[DR-001]\` **Dragón Fuego** — Nvl. 5\n` +
                     `2. \`[DR-022]\` **Dragón Cronos** — Nvl. 14`;

        await sock.sendMessage(jid, { text, mentions: [sender] }, { quoted: m });
    }
};
