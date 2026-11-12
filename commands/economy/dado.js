module.exports = {
    name: 'dado',
    aliases: ['dice'],
    category: 'economy',
    description: 'Lanza un dado y adivina el número para multiplicar tu apuesta.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const numeroElegido = parseInt(args[0]);
        const apuesta = parseInt(args[1]);

        if (!numeroElegido || numeroElegido < 1 || numeroElegido > 8 || isNaN(apuesta)) {
            return await sock.sendMessage(jid, {
                text: '(「✿」 "MINIJUEGO DE DADOS"🌸)\n\nAdivina el número del 1 al 8.\n*Uso:* `!dado <número> <monto>`'
            }, { quoted: m });
        }

        const resultadoDado = Math.floor(Math.random() * 8) + 1;

        if (numeroElegido === resultadoDado) {
            const ganancia = apuesta * 6;
            await sock.sendMessage(jid, {
                text: `(「✿」 "¡DADO ACERTADO!"🌸)\n\n🎲 Cayó en el **${resultadoDado}**.\n🎉 ¡Ganaste **+¥${ganancia.toLocaleString()}** (x6)!`
            }, { quoted: m });
        } else {
            await sock.sendMessage(jid, {
                text: `(「✿」 "TIRO FALLIDO"🌸)\n\n🎲 Cayó en el **${resultadoDado}** (elegiste el ${numeroElegido}).\n💸 Perdiste **-¥${apuesta.toLocaleString()}**.`
            }, { quoted: m });
        }
    }
};
