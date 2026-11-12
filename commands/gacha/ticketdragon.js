module.exports = {
    name: 'ticketdragon',
    category: 'gacha',
    description: 'Usa un ticket para obtener un dragón por su ID.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const id = args[0];
        if (!id) return sock.sendMessage(jid, { text: '(「✿」 "TICKET DRAGÓN"🌸)\n\n⚠️ Uso: `!ticketdragon <ID>`' }, { quoted: m });

        await sock.sendMessage(jid, { text: `(「✿」 "¡DRAGÓN CANJEADO!"🌸)\n\n🎟️ Obtuviste al dragón \`${id}\`.` }, { quoted: m });
    }
};
