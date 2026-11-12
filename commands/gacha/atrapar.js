module.exports = {
    name: 'atrapar',
    aliases: ['catch'],
    category: 'gacha',
    description: 'Atrapa el Pokémon generado con .pokemon.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || jid;

        const text = `(「✿」 "¡CAPTURA EXITOSA!"🌸)\n\n` +
                     `🎉 @${sender.split('@')[0]} atrapó al Pokémon con éxito.`;

        await sock.sendMessage(jid, { text, mentions: [sender] }, { quoted: m });
    }
};
