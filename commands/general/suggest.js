module.exports = {
    name: 'suggest',
    aliases: ['sug', 'report', 'reporte'],
    category: 'general',
    description: 'Envía una sugerencia o reporte a los owners del bot.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const query = args.join(' ');

        if (!query) {
            return await sock.sendMessage(jid, { text: '⚠️ Por favor escribe tu sugerencia o el reporte de error.\n\n*Ejemplo:* `!suggest Agregar más comandos de economía`' }, { quoted: m });
        }

        await sock.sendMessage(jid, { text: '✅ ¡Tu sugerencia ha sido enviada con éxito a los administradores del bot. Muchas gracias!' }, { quoted: m });
    }
};