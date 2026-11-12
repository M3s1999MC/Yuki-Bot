module.exports = {
    name: 'ticketcod',
    category: 'gacha',
    description: 'Usa un ticket para obtener un ítem de COD por su ID.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const id = args[0];
        if (!id) return sock.sendMessage(jid, { text: '(「✿」 "TICKET COD"🌸)\n\n⚠️ Uso: `!ticketcod <ID>`' }, { quoted: m });

        await sock.sendMessage(jid, { text: `(「✿」 "¡ÍTEM COD CANJEADO!"🌸)\n\n🎟️ Obtuviste el ítem \`${id}\`.` }, { quoted: m });
    }
};
