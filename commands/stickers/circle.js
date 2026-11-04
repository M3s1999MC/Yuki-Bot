module.exports = {
    name: 'circle',
    alias: ['redondo'],
    desc: 'Convierte una imagen en un sticker circular',
    run: async (sock, m, args) => {
        await sock.sendMessage(m.key.remoteJid, { text: '⭕ Envía una imagen o gif con el comando `!circle` para hacerla redonda.' }, { quoted: m });
    }
};
