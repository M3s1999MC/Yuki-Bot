module.exports = {
    name: 'miscartas',
    category: 'gacha',
    description: 'Muestra tus cartas de Clash Royale con su nivel.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || jid;
        const pagina = parseInt(args[0]) || 1;

        const text = `(「✿」 "MAZO DE CARTAS - PÁG. ${pagina}"🌸)\n\n` +
                     `👤 *Dueño:* @${sender.split('@')[0]}\n\n` +
                     `1. \`[CR-001]\` **Caballero** — Nvl. 11\n` +
                     `2. \`[CR-030]\` **Megacaballero** — Nvl. 9`;

        await sock.sendMessage(jid, { text, mentions: [sender] }, { quoted: m });
    }
};
