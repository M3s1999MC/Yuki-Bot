module.exports = {
    name: 'info',
    aliases: ['about', 'infobot', 'botinfo', 'status', 'estado'],
    category: 'general',
    description: 'Muestra información detallada y estado del bot.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);

        const caption = `「✿」 Estado del Bot ◢ Yuki ◤\n\n` +
                        `🟢 Estado: En línea y operativa\n` +
                        `⏱️ Tiempo activo: *${hours}h ${minutes}m*\n` +
                        `📦 Base de datos: SQLite (Conectada)\n` +
                        `✨ Versión: 2.5.0 Stable`;

        await sock.sendMessage(jid, { text: caption }, { quoted: m });
    }
};