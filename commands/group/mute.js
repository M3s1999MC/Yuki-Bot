module.exports = {
    name: 'mute',
    aliases: ['silenciar'],
    description: 'Silencia a un usuario para evitar que use comandos',
    async execute(sock, m, args) {
        const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || args[0];
        if (!target) return sock.sendMessage(m.key.remoteJid, { text: '⚠️ Menciona al usuario que quieres silenciar.' }, { quoted: m });

        await sock.sendMessage(m.key.remoteJid, { 
            text: `🤫 @${target.split('@')[0]} ha sido silenciado/a para el uso de comandos de Yuki.`,
            mentions: [target]
        }, { quoted: m });
    }
};
