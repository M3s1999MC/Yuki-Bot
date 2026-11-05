module.exports = {
    name: 'qc',
    aliases: ['quote'],
    description: 'Transforma un texto citado en una tarjeta de sticker tipo frase',
    async execute(sock, m, args) {
        const texto = args.join(' ');
        if (!texto) return sock.sendMessage(m.key.remoteJid, { text: '⚠️ Escribe o cita un mensaje para convertirlo en tarjeta de sticker.' }, { quoted: m });
        await sock.sendMessage(m.key.remoteJid, { text: `💬 Creando sticker de cita con el texto: "${texto}"` }, { quoted: m });
    }
};
