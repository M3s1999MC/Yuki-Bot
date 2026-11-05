module.exports = {
    name: 'circle',
    aliases: ['redondo'],
    description: 'Convierte una imagen en un sticker circular',
    async execute(sock, m) {
        await sock.sendMessage(m.key.remoteJid, { text: '⭕ Envía una imagen o gif con el comando `!circle` para hacerla redonda.' }, { quoted: m });
    }
};
