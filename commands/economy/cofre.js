module.exports = {
    name: 'cofre',
    aliases: ['chest'],
    category: 'economy',
    description: 'Abre un cofre misterioso cada 24 horas para ganar grandes recompensas.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;

        // Simulación de recompensas aleatorias
        const yenesGanados = Math.floor(Math.random() * 5000) + 2000;

        const text = `🎁 *¡COFRE ABIERTO CON ÉXITO!* 🎁\n\n` +
                     `✨ Dentro del cofre misterioso encontraste:\n` +
                     `💰 *+¥${yenesGanados.toLocaleString()}* para tu billetera.\n\n` +
                     `⏰ Podrás abrir otro cofre dentro de 24 horas.`;

        await sock.sendMessage(jid, { text }, { quoted: m });
    }
};
