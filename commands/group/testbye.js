const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'testbye',
    category: 'groups',
    description: 'Prueba el mensaje de despedida personalizado del grupo.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        if (!jid.endsWith('@g.us')) {
            return await sock.sendMessage(jid, { text: '⚠️ Este comando solo se puede usar en grupos.' }, { quoted: m });
        }

        const sender = getMessageSenderJid(m, sock);
        const username = sender.split('@')[0];

        const groupMetadata = await sock.groupMetadata(jid);
        const groupName = groupMetadata.subject;
        const totalMembers = groupMetadata.participants.length;

        let ppUrl;
        try {
            ppUrl = await sock.profilePictureUrl(sender, 'image');
        } catch {
            ppUrl = 'https://i.imgur.com/4M34hi2.png';
        }

        db.getSafeGroup(jid, async (err, row) => {
            if (err || !row || !row.goodbye_text) {
                return await sock.sendMessage(jid, { 
                    text: '⚠️ No hay ningún mensaje de despedida configurado. Usa `!setbye` primero.' 
                }, { quoted: m });
            }

            const customMessage = row.goodbye_text;

            const userMentionTag = `@${username}`;
            const finalCaption = customMessage
                .replace(/{usuario}/g, userMentionTag)
                .replace(/{grupo}/g, groupName)
                .replace(/{miembros}/g, totalMembers);

            await sock.sendMessage(jid, {
                image: { url: ppUrl },
                caption: finalCaption,
                mentions: [sender]
            }, { quoted: m });
        });
    }
};
