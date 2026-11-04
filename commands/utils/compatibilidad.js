module.exports = {
    name: 'compatibilidad',
    aliases: ['shipbot'],
    description: 'Mide qué tan compatible eres hoy con Yuki',
    async execute(sock, m) {
        const jid = m.key.participant || m.key.remoteJid;
        const porc = Math.floor(Math.random() * 100);
        await sock.sendMessage(m.key.remoteJid, { 
            text: `🌸 *COMPATIBILIDAD CON YUKI* 🌸\n\n👤 Usuario: @${jid.split('@')[0]}\n💖 Compatibilidad: *${porc}%*`,
            mentions: [jid]
        }, { quoted: m });
    }
};
