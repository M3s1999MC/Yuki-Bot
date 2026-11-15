module.exports = {
    name: 'testwelcome',
    category: 'groups',
    description: 'Prueba el mensaje de bienvenida personalizado configurado con !setwelcome.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        if (!m.key.participant && !jid.endsWith('@g.us')) {
            return await sock.sendMessage(jid, { text: '⚠️ Este comando solo se puede usar en grupos.' }, { quoted: m });
        }

        const sender = m.key.participant || m.key.remoteJid;

        // Obtener metadatos del grupo
        const groupMetadata = await sock.groupMetadata(jid);
        const groupName = groupMetadata.subject;
        const totalMembers = groupMetadata.participants.length;

        // Obtener la foto de perfil del usuario (con respaldo si está oculta)
        let ppUrl;
        try {
            ppUrl = await sock.profilePictureUrl(sender, 'image');
        } catch {
            ppUrl = 'https://i.imgur.com/4M34hi2.png';
        }

        // Recuperar únicamente el texto guardado con !setwelcome
        const chatData = global.db?.data?.chats?.[jid] || {};
        const customMessage = chatData.welcomeMessage;

        if (!customMessage) {
            return await sock.sendMessage(jid, { 
                text: '⚠️ No hay ningún mensaje de bienvenida configurado. Usa `!setwelcome` para establecer uno.' 
            }, { quoted: m });
        }

        // Reemplazar los broches por los datos reales
        const userMentionTag = `@${sender.split('@')[0]}`;
        const finalCaption = customMessage
            .replace(/{usuario}/g, userMentionTag)
            .replace(/{grupo}/g, groupName)
            .replace(/{miembros}/g, totalMembers);

        // Enviar imagen con el texto customizado y la mención activa
        await sock.sendMessage(jid, {
            image: { url: ppUrl },
            caption: finalCaption,
            mentions: [sender]
        }, { quoted: m });
    }
};
