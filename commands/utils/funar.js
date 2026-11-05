module.exports = {
    name: 'funar',
    aliases: ['funa'],
    description: 'Inventa una razón cómica para funar a un usuario',
    async execute(sock, m) {
        const user = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.key.participant || m.key.remoteJid;
        const razones = [
            'por poner la leche antes que el cereal.',
            'por dejar los audios de WhatsApp en velocidad 2x.',
            'por responder "jajaja" y tener cara seria en la vida real.',
            'por no compartir las arepas con queso.'
        ];
        const raz = razones[Math.floor(Math.random() * razones.length)];
        await sock.sendMessage(m.key.remoteJid, { 
            text: `📢 *¡FUNA PÚBLICA!* @${user.split('@')[0]} queda totalmente funado/a ${raz}`,
            mentions: [user]
        }, { quoted: m });
    }
};
