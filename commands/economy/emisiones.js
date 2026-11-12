module.exports = {
    name: 'emisiones',
    aliases: ['misioneseconomia', 'tareas'],
    category: 'economy',
    description: 'Misiones diarias de economía.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const text = `(「✿」 "MISIONES DIARIAS"🌸)\n\n` +
                     `1. 🪙 Ahorrador: Deposita 3 veces (0/3) - Recompensa: ¥1,000\n` +
                     `2. ⛏️ Minero: Usa .minar 2 veces (0/2) - Recompensa: ¥1,500\n\n` +
                     `💡 Escribe \`!emisiones cobrar\` para reclamar.`;

        await sock.sendMessage(jid, { text }, { quoted: m });
    }
};
