const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'testbye',
    category: 'groups',
    description: 'Prueba el mensaje de despedida personalizado configurado con !setbye.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        if (!m.key.participant && !jid.endsWith('@g.us')) {
            return await sock.sendMessage(jid, { text: '⚠️ Este comando solo se puede usar en grupos.' }, { quoted: m });
        }

        const sender = getMessageSenderJid(m, sock);
        const username = sender.split('@')[0];

        // Obtener metadatos del grupo
        const groupMetadata = await sock.groupMetadata(jid);
        const groupName = groupMetadata.subject;
        const totalMembers = groupMetadata.participants.length;

        // Obtener foto de perfil (con respaldo si está oculta)
        let ppUrl;
        try {
            ppUrl = await sock.profilePictureUrl(sender, 'image');
        } catch {
            ppUrl = 'https://i.imgur.com/4M34hi2.png';
        }

        // Consultar el mensaje de despedida en SQLite
        db.get(`SELECT bye_message FROM group_settings WHERE jid = ?`, [jid], async (err, row) => {
            if (err || !row || !row.bye_message) {
                return await sock.sendMessage(jid, { 
                    text: '⚠️ No hay ningún mensaje de despedida configurado en este grupo. Usa `!setbye` primero.' 
                }, { quoted: m });
            }

            const customMessage = row.bye_message;

            // Reemplazar los broches por los datos reales
            const userMentionTag = `@${username}`;
            const finalCaption = customMessage
                .replace(/{usuario}/g, userMentionTag)
                .replace(/{grupo}/g, groupName)
                .replace(/{miembros}/g, totalMembers);

            // Enviar imagen con el texto de despedida customizado y la mención
            await sock.sendMessage(jid, {
                image: { url: ppUrl },
                caption: finalCaption,
                mentions: [sender]
            }, { quoted: m });
        });
    }
};
