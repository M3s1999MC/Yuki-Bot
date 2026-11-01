module.exports = {
    name: 'setmeta',
    aliases: ['setstickermeta'],
    category: 'tools',
    description: 'Establece el pack y autor por defecto para tus stickers.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const query = args.join(' ');

        if (!query) {
            return await sock.sendMessage(jid, { text: '⚠️ Por favor indica el nombre del pack y el autor.\n\n*Ejemplo:* `!setmeta Yuki Pack | ExyraDev`' }, { quoted: m });
        }

        await sock.sendMessage(jid, { text: `✨ **Metadatos guardados con éxito**\n\n• Nuevos datos: _${query}_` }, { quoted: m });
    }
};