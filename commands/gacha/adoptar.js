module.exports = {
    name: 'adoptar',
    category: 'gacha',
    description: 'Adopta el gusanito generado con .snake.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || jid;

        const text = `(「✿」 "ADOPCIÓN COMPLETADA"🌸)\n\n` +
                     `🎉 @${sender.split('@')[0]} adoptó al Snake en su terrario.`;

        await sock.sendMessage(jid, { text, mentions: [sender] }, { quoted: m });
    }
};
