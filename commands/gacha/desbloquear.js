module.exports = {
    name: 'desbloquear',
    category: 'gacha',
    description: 'Reclama el personaje que apareció en la última tirada de Clash Royale.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || jid;

        const text = `(「✿」 "CARTA DESBLOQUEADA"🌸)\n\n` +
                     `🎉 @${sender.split('@')[0]} añadió la carta a su mazo de batalla.`;

        await sock.sendMessage(jid, { text, mentions: [sender] }, { quoted: m });
    }
};
