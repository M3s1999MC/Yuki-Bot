module.exports = {
    name: 'ruleta',
    aliases: ['roulette'],
    category: 'economy',
    description: 'Ruleta de colores y números.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const opcion = args[0]?.toLowerCase();
        const apuesta = parseInt(args[1]);

        if (!opcion || isNaN(apuesta)) {
            const tabla = `(「✿」 "RULETA DEL CASINO"🌸)\n\n` +
                          `Apuesta a colores:\n` +
                          `🔴 *Rojo* (x2)\n` +
                          `⚫ *Negro* (x2)\n` +
                          `🟢 *Verde* (x14)\n\n` +
                          `*Uso:* \`!ruleta <color> <monto>\``;
            return await sock.sendMessage(jid, { text: tabla }, { quoted: m });
        }

        const numero = Math.floor(Math.random() * 37);
        let colorResultado = numero === 0 ? 'verde' : (numero % 2 === 0 ? 'negro' : 'rojo');
        const gano = (opcion === colorResultado);

        if (gano) {
            const premio = apuesta * (colorResultado === 'verde' ? 14 : 2);
            await sock.sendMessage(jid, {
                text: `(「✿」 "¡VICTORIA EN RULETA!"🌸)\n\n🎡 Salió **${numero} (${colorResultado.toUpperCase()})**.\n🎉 ¡Ganaste **+¥${premio.toLocaleString()}**!`
            }, { quoted: m });
        } else {
            await sock.sendMessage(jid, {
                text: `(「✿」 "DERROTA EN RULETA"🌸)\n\n🎡 Salió **${numero} (${colorResultado.toUpperCase()})**.\n💸 Perdiste **-¥${apuesta.toLocaleString()}**.`
            }, { quoted: m });
        }
    }
};
