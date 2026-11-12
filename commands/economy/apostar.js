module.exports = {
    name: 'apuesta',
    aliases: ['casino', 'bet'],
    category: 'economy',
    description: 'Apuesta en el casino contra el bot.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const monto = parseInt(args[0]);

        if (!monto || isNaN(monto)) {
            return await sock.sendMessage(jid, { text: '(「✿」 "APUESTA DE CASINO"🌸)\n\nIndica la cantidad a apostar.\n*Uso:* `!apuesta <cantidad>`' }, { quoted: m });
        }

        const gano = Math.random() >= 0.48;
        if (gano) {
            const ganancia = Math.floor(monto * 0.5);
            await sock.sendMessage(jid, { text: `(「✿」 "¡VICTORIA EN CASINO!"🌸)\n\n💰 Ganaste un extra de *+¥${ganancia.toLocaleString()}*.` }, { quoted: m });
        } else {
            await sock.sendMessage(jid, { text: `(「✿」 "DERROTA EN CASINO"🌸)\n\n📉 La suerte no estuvo de tu lado esta vez.` }, { quoted: m });
        }
    }
};
