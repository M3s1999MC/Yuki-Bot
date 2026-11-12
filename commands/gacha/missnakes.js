module.exports = {
    name: 'missnakes',
    aliases: ['misgusanitos'],
    category: 'gacha',
    description: 'Muestra tus Snakes con su nivel.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || jid;
        const pagina = parseInt(args[0]) || 1;

        const text = `(「✿」 "TERRARIO DE SNAKES - PÁG. ${pagina}"🌸)\n\n` +
                     `👤 *Dueño:* @${sender.split('@')[0]}\n\n` +
                     `1. \`[SN-001]\` **Gusanito Neón** — Nvl. 8\n` +
                     `2. \`[SN-009]\` **Cobra Galáctica** — Nvl. 12`;

        await sock.sendMessage(jid, { text, mentions: [sender] }, { quoted: m });
    }
};
