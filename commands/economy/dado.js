module.exports = {
    name: 'dado',
    aliases: ['dice'],
    category: 'economy',
    description: 'Adivina el número del dado (1 al 8) y gana 6 veces lo apostado.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const numeroElegido = parseInt(args[0]);
        const apuesta = parseInt(args[1]);

        if (!numeroElegido || numeroElegido < 1 || numeroElegido > 8 || isNaN(apuesta) || apuesta <= 0) {
            return await sock.sendMessage(jid, {
                text: '🎲 *USO DEL DADO:*\nEscribe `!dado <número 1-8> <monto>`\n\n*Ejemplo:* `!dado 5 500`'
            }, { quoted: m });
        }

        // TODO: Validar en Neon/Postgres que el usuario tenga saldo >= apuesta

        const resultadoDado = Math.floor(Math.random() * 8) + 1;

        if (numeroElegido === resultadoDado) {
            const ganancia = apuesta * 6;
            // TODO: Sumar ganancia en Neon/Postgres
            await sock.sendMessage(jid, {
                text: `🎲 El dado rodó y cayó en el **${resultadoDado}**...\n\n🎉 ¡ADIVINASTE! Ganaste **+¥${ganancia.toLocaleString()}** (x6).`
            }, { quoted: m });
        } else {
            // TODO: Restar apuesta en Neon/Postgres
            await sock.sendMessage(jid, {
                text: `🎲 El dado rodó y cayó en el **${resultadoDado}**...\n\n💸 Mala suerte, elegiste el ${numeroElegido} y perdiste **-¥${apuesta.toLocaleString()}**.`
            }, { quoted: m });
        }
    }
};
