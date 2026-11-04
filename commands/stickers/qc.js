module.exports = {
    name: 'qc',
    alias: ['quoteSticker'],
    desc: 'Transforma un texto citado en una tarjeta de sticker tipo frase',
    run: async (sock, m, args) => {
        const texto = args.join(' ');
        if (!texto) return sock.sendMessage(m.key.remoteJid, { text: '⚠️ Escribe o cita un mensaje para convertirlo en tarjeta de sticker.' }, { quoted: m });
        await sock.sendMessage(m.key.remoteJid, { text: `💬 Creando sticker de cita con el texto: "${texto}"` }, { quoted: m });
    }
};
