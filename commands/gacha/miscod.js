module.exports = {
    name: 'miscod',
    category: 'gacha',
    description: 'Muestra tus ítems de Call of Duty con su nivel.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || jid;
        const pagina = parseInt(args[0]) || 1;

        const text = `(「✿」 "ARMERÍA DE COD - PÁG. ${pagina}"🌸)\n\n` +
                     `👤 *Dueño:* @${sender.split('@')[0]}\n\n` +
                     `1. \`[CD-001]\` **Ghost - Stealth** — Nvl. 6\n` +
                     `2. \`[CD-010]\` **AK-47 Radiance** — Nvl. 15`;

        await sock.sendMessage(jid, { text, mentions: [sender] }, { quoted: m });
    }
};
