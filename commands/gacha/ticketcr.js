module.exports = {
    name: 'ticketcr',
    category: 'gacha',
    description: 'Usa un ticket para obtener una carta por su ID.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const id = args[0];
        if (!id) return sock.sendMessage(jid, { text: '(「✿」 "TICKET CLASH"🌸)\n\n⚠️ Uso: `!ticketcr <ID>`' }, { quoted: m });

        await sock.sendMessage(jid, { text: `(「✿」 "¡CARTA CANJEADA!"🌸)\n\n🎟️ Obtuviste la carta \`${id}\`.` }, { quoted: m });
    }
};
