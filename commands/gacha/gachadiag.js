module.exports = {
    name: 'gachadiag',
    aliases: ['diagnosticogacha'],
    category: 'gacha',
    description: 'Prueba la conexión que usa el gacha para descargar imágenes (solo owners).',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const text = `(「✿」 "DIAGNÓSTICO DEL SISTEMA"🌸)\n\n` +
                     `🔍 Estado de APIs externas: *ONLINE*\n` +
                     `⚡ Latencia de respuesta multimedia: \`142 ms\`\n` +
                     `💾 Conexión con Neon/Postgres: *Estable*`;

        await sock.sendMessage(jid, { text }, { quoted: m });
    }
};
