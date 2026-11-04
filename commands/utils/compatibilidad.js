module.exports = {
    name: 'compatibilidad',
    alias: ['shipbot'],
    desc: 'Mide qué tan compatible eres hoy con Yuki',
    run: async (sock, m) => {
        const jid = m.key.participant || m.key.remoteJid;
        const porc = Math.floor(Math.random() * 100);
        await sock.sendMessage(m.key.remoteJid, { 
            text: `🌸 *COMPATIBILIDAD CON YUKI* 🌸\n\n👤 Usuario: @${jid.split('@')[0]}\n💖 Compatibilidad: *${porc}%*`,
            mentions: [jid]
        }, { quoted: m });
    }
};
