module.exports = {
    name: 'link',
    aliases: ['enlace'],
    category: 'groups',
    description: 'Muestra el enlace de invitación del grupo.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;

        await sock.sendMessage(jid, {
            text: '(「✿」 "ENLACE DE INVITACIÓN"🌸)\n\n🔗 https://chat.whatsapp.com/EjemploEnlaceYukiBot'
        }, { quoted: m });
    }
};
