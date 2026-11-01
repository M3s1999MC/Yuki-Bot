module.exports = {
    name: 'getpic',
    aliases: ['pfp'],
    category: 'utility',
    description: 'Ver la foto de perfil de un usuario.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        let target;
        const contextInfo = m.message?.extendedTextMessage?.contextInfo;

        if (contextInfo?.participant) {
            target = contextInfo.participant;
        } else if (contextInfo?.mentionedJid && contextInfo.mentionedJid.length > 0) {
            target = contextInfo.mentionedJid[0];
        } else {
            target = jid.endsWith('@g.us') ? (m.key.participant || m.key.remoteJid) : jid;
        }

        try {
            const ppUrl = await sock.profilePictureUrl(target, 'image');
            await sock.sendMessage(jid, { image: { url: ppUrl }, caption: '🌸 **Foto de perfil obtenida con éxito**' }, { quoted: m });
        } catch {
            await sock.sendMessage(jid, { text: '❌ Este usuario no tiene foto de perfil pública o no se pudo obtener.' }, { quoted: m });
        }
    }
};