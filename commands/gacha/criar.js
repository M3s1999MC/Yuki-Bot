module.exports = {
    name: 'criar',
    category: 'gacha',
    description: 'Reclama el dragón que apareció en la última tirada.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || jid;

        const text = `(「✿」 "INCUBACIÓN EXITOSA"🌸)\n\n` +
                     `🎉 @${sender.split('@')[0]} crió al dragón en su isla.`;

        await sock.sendMessage(jid, { text, mentions: [sender] }, { quoted: m });
    }
};
