module.exports = {
    name: 'drop',
    category: 'gacha',
    description: 'Reclama el brawler generado con .brawlstars.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || jid;

        const text = `(「✿」 "BRAWLER DESBLOQUEADO"🌸)\n\n` +
                     `🎉 @${sender.split('@')[0]} reclamó el Brawler a su colección.`;

        await sock.sendMessage(jid, { text, mentions: [sender] }, { quoted: m });
    }
};
