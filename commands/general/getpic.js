module.exports = {
    name: 'getpic',
    aliases: ['pfp', 'verfoto'],
    category: 'general',
    description: 'Ver la foto de perfil de un usuario (mencionando o respondiendo a su mensaje).',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        let target = m.key.participant || m.key.remoteJid;

        // Detectar si se mencionó a alguien o se respondió a su mensaje
        if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
            target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (m.message?.extendedTextMessage?.contextInfo?.participant) {
            target = m.message.extendedTextMessage.contextInfo.participant;
        }

        try {
            // Obtener la URL de la foto de perfil del usuario de WhatsApp
            const ppUrl = await sock.profilePictureUrl(target, 'image');

            const res = await fetch(ppUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            const imageBuffer = Buffer.from(await res.arrayBuffer());

            await sock.sendMessage(jid, {
                image: imageBuffer,
                caption: `🖼️ *Foto de perfil de @${target.split('@')[0]}*`,
                mentions: [target]
            }, { quoted: m });

        } catch (err) {
            await sock.sendMessage(jid, { 
                text: `❌ El usuario @${target.split('@')[0]} no tiene foto de perfil pública o no se pudo obtener.`,
                mentions: [target] 
            }, { quoted: m });
        }
    }
};