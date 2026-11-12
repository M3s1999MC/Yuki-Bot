module.exports = {
    name: 'ruleta',
    aliases: ['roulette'],
    category: 'economy',
    description: 'Ruleta de colores y números con multiplicadores reales.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const opcion = args[0]?.toLowerCase();
        const apuesta = parseInt(args[1]);

        if (!opcion || isNaN(apuesta) || apuesta <= 0) {
            const tabla = `🎰 *RULETA DEL CASINO YUKI* 🎰\n\n` +
                          `Apuesta a un color o número:\n` +
                          `🔴 *Rojo* (x2)\n` +
                          `⚫ *Negro* (x2)\n` +
                          `🟢 *Verde / 0* (x14)\n\n` +
                          `*Uso:* \`!ruleta <color> <monto>\`\n` +
                          `*Ejemplo:* \`!ruleta rojo 1000\``;
            return await sock.sendMessage(jid, { text: tabla }, { quoted: m });
        }

        const coloresValidos = ['rojo', 'negro', 'verde', '0'];
        if (!coloresValidos.includes(opcion)) {
            return await sock.sendMessage(jid, { text: '⚠️ Elige un color válido: `rojo`, `negro` o `verde`.' }, { quoted: m });
        }

        // Probabilidad real (0-36: 0 es verde, impares rojo, pares negro)
        const numero = Math.floor(Math.random() * 37);
        let colorResultado = 'verde';
        if (numero !== 0) {
            colorResultado = numero % 2 === 0 ? 'negro' : 'rojo';
        }

        const gano = (opcion === colorResultado) || (opcion === '0' && numero === 0);

        if (gano) {
            const multiplicador = colorResultado === 'verde' ? 14 : 2;
            const premio = apuesta * multiplicador;
            await sock.sendMessage(jid, {
                text: `🎡 La ruleta se detuvo en: **${numero} (${colorResultado.toUpperCase()})**\n\n🎉 ¡GANASTE **+¥${premio.toLocaleString()}**!`
            }, { quoted: m });
        } else {
            await sock.sendMessage(jid, {
                text: `🎡 La ruleta se detuvo en: **${numero} (${colorResultado.toUpperCase()})**\n\n💸 Perdiste **-¥${apuesta.toLocaleString()}**.`
            }, { quoted: m });
        }
    }
};
