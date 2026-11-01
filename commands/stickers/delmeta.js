module.exports = {
    name: 'delmeta',
    aliases: ['delstickermeta'],
    category: 'tools',
    description: 'Restablece el pack y autor por defecto para tus stickers.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        await sock.sendMessage(jid, { text: '🗑️ Los metadatos personalizados de tus stickers han sido restablecidos a los valores predeterminados.' }, { quoted: m });
    }
};