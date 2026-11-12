module.exports = {
    name: 'ticketsnake',
    category: 'gacha',
    description: 'Usa un ticket para obtener un Snake por su ID.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const id = args[0];
        if (!id) return sock.sendMessage(jid, { text: '(「✿」 "TICKET SNAKE"🌸)\n\n⚠️ Uso: `!ticketsnake <ID>`' }, { quoted: m });

        await sock.sendMessage(jid, { text: `(「✿」 "¡SNAKE CANJEADO!"🌸)\n\n🎟️ Obtuviste al Snake \`${id}\`.` }, { quoted: m });
    }
};
