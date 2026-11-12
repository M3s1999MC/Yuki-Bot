module.exports = {
    name: 'ticketbs',
    aliases: ['ticketbrawl'],
    category: 'gacha',
    description: 'Usa un ticket para obtener un Brawler por su ID.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const id = args[0];
        if (!id) return sock.sendMessage(jid, { text: '(「✿」 "TICKET BRAWL"🌸)\n\n⚠️ Uso: `!ticketbs <ID>`' }, { quoted: m });

        await sock.sendMessage(jid, { text: `(「✿」 "¡BRAWLER CANJEADO!"🌸)\n\n🎟️ Obtuviste al Brawler \`${id}\`.` }, { quoted: m });
    }
};
