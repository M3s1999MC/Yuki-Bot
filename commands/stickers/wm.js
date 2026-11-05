module.exports = {
    name: 'wm',
    aliases: ['take'],
    description: 'Cambia el nombre del pack y autor de un sticker',
    async execute(sock, m) {
        await sock.sendMessage(m.key.remoteJid, { text: '🎨 Envía o cita un sticker para reempaquetarlo con tu nombre de autor.' }, { quoted: m });
    }
};
