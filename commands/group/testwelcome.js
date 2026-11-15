const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'testwelcome',
    category: 'groups',
    description: 'Prueba el mensaje de bienvenida personalizado del grupo.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        if (!jid.endsWith('@g.us')) {
            return await sock.sendMessage(jid, { text: '⚠️ Este comando solo se puede usar en grupos.' }, { quoted: m });
        }

        const sender = getMessageSenderJid(m, sock);
        const username = sender.split('@')[0];

        // Obtener metadatos del grupo
        const groupMetadata = await sock.groupMetadata(jid);
        const groupName = groupMetadata.subject;
        const totalMembers = groupMetadata.participants.length;

        // Obtener foto de perfil
        let ppUrl;
        try {
            ppUrl = await sock.profilePictureUrl(sender, 'image');
        } catch {
            ppUrl = 'https://i.imgur.com/4M34hi2.png';
        }

        // Consultar la configuración del grupo usando tu método nativo getSafeGroup
        db.getSafeGroup(jid, async (err, row) => {
            if (err || !row || !row.welcome_text) {
                return await sock.sendMessage(jid, { 
                    text: '⚠️ No hay ningún mensaje de bienvenida configurado. Usa `!setwelcome` primero.' 
                }, { quoted: m });
            }

            const customMessage = row.welcome_text;

            // Reemplazar los broches por los datos reales
            const userMentionTag = `@${username}`;
            const finalCaption = customMessage
                .replace(/{usuario}/g, userMentionTag)
                .replace(/{grupo}/g, groupName)
                .replace(/{miembros}/g, totalMembers);

            // Enviar imagen con el texto customizado y mención activa
            await sock.sendMessage(jid, {
                image: { url: ppUrl },
                caption: finalCaption,
                mentions: [sender]
            }, { quoted: m });
        });
    }
};
