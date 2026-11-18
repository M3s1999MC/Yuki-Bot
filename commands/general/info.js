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
        const seconds = Math.floor(uptime % 60);

        let uptimeString = '';
        if (hours > 0) uptimeString += `${hours}h `;
        if (minutes > 0 || hours > 0) uptimeString += `${minutes}m `;
        uptimeString += `${seconds}s`;

        const caption = `₊˚ˑ༄ 𝖄𝖚𝖐𝖎 // SYSTEM STATUS 𓍢ִ໋☕\n\n` +
                        `❀ ❟ *Estado:* En línea y operativa ✧\n` +
                        `❀ ❟ *Tiempo activo:* \`${uptimeString.trim()}\`\n` +
                        `❀ ❟ *Base de datos:* SQLite (Sincronizada)\n` +
                        `❀ ❟ *Versión:* v2.5.0 Stable\n\n` +
                        `° 𐐪𐑂 Operando bajo los protocolos de INKRA STUDIOS. ✿`;

        await sock.sendMessage(jid, { text: caption }, { quoted: m });
    }
};
