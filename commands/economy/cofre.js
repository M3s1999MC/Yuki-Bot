module.exports = {
    name: 'cofre',
    aliases: ['chest'],
    category: 'economy',
    description: 'Abre un cofre misterioso (cada 24 horas).',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const yenesGanados = Math.floor(Math.random() * 5000) + 2000;

        const text = `(「✿」 "COFRE MISTERIOSO ABIERTO"🌸)\n\n` +
                     `🎁 Encontraste un botín secreto en el cofre:\n` +
                     `💰 *+¥${yenesGanados.toLocaleString()}* para tu billetera.`;

        await sock.sendMessage(jid, { text }, { quoted: m });
    }
};
