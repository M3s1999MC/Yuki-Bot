const db = require('../../database/db');

export async function before(m, { conn }) {
    if (!m.isGroup) return;
    // 28 o 32 suelen indicar que alguien salió o fue removido del grupo
    if (m.messageStubType !== 28 && m.messageStubType !== 32) return; 

    const jid = m.chat;

    db.get(`SELECT bye_message FROM group_settings WHERE jid = ?`, [jid], async (err, row) => {
        if (err || !row || !row.bye_message) return;

        const customMessage = row.bye_message;

        let groupMetadata;
        try {
            groupMetadata = await conn.groupMetadata(jid);
        } catch {
            return;
        }

        const groupName = groupMetadata.subject;
        const totalMembers = groupMetadata.participants.length;

        for (let leftUser of m.messageStubParameters) {
            let ppUrl;
            try {
                ppUrl = await conn.profilePictureUrl(leftUser, 'image');
            } catch {
                ppUrl = 'https://i.imgur.com/4M34hi2.png'; // Imagen de respaldo si tiene privacidad
            }

            const username = leftUser.split('@')[0];
            const userMentionTag = `@${username}`;
            const finalCaption = customMessage
                .replace(/{usuario}/g, userMentionTag)
                .replace(/{grupo}/g, groupName)
                .replace(/{miembros}/g, totalMembers);

            await sock.sendMessage(jid, {
                image: { url: ppUrl },
                caption: finalCaption,
                mentions: [leftUser]
            });
        }
    });
}
