module.exports = {
    name: 'equipar',
    category: 'gacha',
    description: 'Reclama el ítem de COD que apareció en la última tirada.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || jid;

        const text = `(「✿」 "ÍTEM EQUIPADO"🌸)\n\n` +
                     `🎉 @${sender.split('@')[0]} guardó el ítem en su armería táctica.`;

        await sock.sendMessage(jid, { text, mentions: [sender] }, { quoted: m });
    }
};
