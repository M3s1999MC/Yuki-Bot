module.exports = {
    name: 'allw',
    aliases: ['todostrabajos'],
    category: 'economy',
    description: 'Reclamar todos los trabajos disponibles.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const total = 4500;

        const text = `(「✿」 "COBRO DE OFICIOS GENERAL"🌸)\n\n` +
                     `✨ Has reclamado todos tus trabajos pendientes.\n` +
                     `💰 Total obtenido: *+¥${total.toLocaleString()}*`;

        await sock.sendMessage(jid, { text }, { quoted: m });
    }
};
