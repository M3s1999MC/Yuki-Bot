module.exports = {
    name: 'bratv',
    category: 'tools',
    description: 'Crea un video-sticker estilo brat con texto animado.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const text = args.join(' ');

        if (!text) {
            return await sock.sendMessage(jid, { text: '⚠️ Por favor escribe un texto para generar el video-sticker brat.\n\n*Ejemplo:* `!bratv Yuki`' }, { quoted: m });
        }

        await sock.sendMessage(jid, { text: `🎥 Procesando video-sticker estilo brat para: *${text}*...` }, { quoted: m });
    }
};