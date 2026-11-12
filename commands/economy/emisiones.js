module.exports = {
    name: 'emisiones',
    aliases: ['misioneseconomia', 'tareas'],
    category: 'economy',
    description: 'Consulta y cobra tus misiones diarias y fijas de economía.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;

        const texto = `📋 *MISIONES DIARIAS DE ECONOMÍA* 📋\n\n` +
                      `1. 🪙 *Ahorrador:* Deposita 3 veces al banco (0/3) - Recompensa: ¥1,000\n` +
                      `2. ⛏️ *Minero Activo:* Usa el comando .minar 2 veces (0/2) - Recompensa: ¥1,500\n` +
                      `3. 🎰 *Apostador:* Guega 1 vez en la ruleta o dado (0/1) - Recompensa: ¥2,000\n\n` +
                      `💡 *Uso:* Escribe \`!emisiones cobrar\` para reclamar tus recompensas listas.`;

        await sock.sendMessage(jid, { text: texto }, { quoted: m });
    }
};
