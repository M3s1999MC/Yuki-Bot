module.exports = {
    name: 'apuesta',
    aliases: ['casino', 'bet'],
    category: 'economy',
    description: 'Apuesta en el casino: ganas un porcentaje extra o pierdes solo una parte.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const input = args[0]?.toLowerCase();

        // Simulación de saldo actual en billetera (conectar a Neon/Postgres)
        const saldoActual = 5000;

        if (!input) {
            return await sock.sendMessage(jid, {
                text: '🎰 *CASINO DE YUKI*\n\nIndica cuánto quieres apostar.\n*Uso:* `!apuesta <cantidad|todo>`'
            }, { quoted: m });
        }

        const monto = input === 'todo' ? saldoActual : parseInt(input);

        if (isNaN(monto) || monto <= 0) {
            return await sock.sendMessage(jid, { text: '⚠️ Ingresa una cantidad válida mayor a 0.' }, { quoted: m });
        }

        if (monto > saldoActual) {
            return await sock.sendMessage(jid, { text: `❌ No tienes suficiente dinero en tu billetera (Saldo: ¥${saldoActual.toLocaleString()}).` }, { quoted: m });
        }

        const gano = Math.random() >= 0.48; // 52% de probabilidad de ganar

        if (gano) {
            // Gana entre el 30% y el 80% extra de lo apostado
            const porcentaje = Math.floor(Math.random() * 51) + 30;
            const ganancia = Math.floor(monto * (porcentaje / 100));

            await sock.sendMessage(jid, {
                text: `🎰 *¡GANASTE EN EL CASINO!* 🎰\n\n` +
                      `📈 Multiplicador: *+${porcentaje}%*\n` +
                      `💰 Ganancia neta: *+¥${ganancia.toLocaleString()}*`
            }, { quoted: m });
        } else {
            // Solo pierde entre el 40% y el 70% de lo apostado
            const porcentajePerdida = Math.floor(Math.random() * 31) + 40;
            const perdida = Math.floor(monto * (porcentajePerdida / 100));

            await sock.sendMessage(jid, {
                text: `📉 *MALA RACHA EN EL CASINO* 📉\n\n` +
                      `🛡️ Lograste rescatar parte de tu apuesta, pero perdiste el *${porcentajePerdida}%*.\n` +
                      `💸 Pérdida: *-¥${perdida.toLocaleString()}*`
            }, { quoted: m });
        }
    }
};
