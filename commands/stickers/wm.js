module.exports = {
    name: 'wm',
    alias: ['take'],
    desc: 'Cambia el nombre del pack y autor de un sticker',
    run: async (sock, m, args) => {
        await sock.sendMessage(m.key.remoteJid, { text: '🎨 Envía o cita un sticker para reempaquetarlo con tu nombre de autor.' }, { quoted: m });
    }
};
