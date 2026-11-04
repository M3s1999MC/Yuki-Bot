module.exports = {
    name: 'unmute',
    alias: ['desilenciar'],
    desc: 'Le devuelve los permisos a un usuario silenciado',
    run: async (sock, m, args, db) => {
        const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || args[0];
        if (!target) return sock.sendMessage(m.key.remoteJid, { text: '⚠️ Menciona al usuario que deseas desilenciar.' }, { quoted: m });

        await sock.sendMessage(m.key.remoteJid, { 
            text: `🔊 @${target.split('@')[0]} ya puede volver a usar los comandos de Yuki.`,
            mentions: [target]
        }, { quoted: m });
    }
};
