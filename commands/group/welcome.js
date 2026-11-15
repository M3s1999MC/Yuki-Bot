const db = require('../../database/db');

export async function before(m, { conn }) {
    if (!m.isGroup) return;
    if (m.messageStubType !== 27) return; 

    const jid = m.chat;

    db.get(`SELECT welcome_message FROM group_settings WHERE jid = ?`, [jid], async (err, row) => {
        if (err || !row || !row.welcome_message) return;

        const customMessage = row.welcome_message;

        let groupMetadata;
        try {
            groupMetadata = await conn.groupMetadata(jid);
        } catch {
            return;
        }

        const groupName = groupMetadata.subject;
        const totalMembers = groupMetadata.participants.length;

        for (let newUser of m.messageStubParameters) {
            let ppUrl;
            try {
                ppUrl = await conn.profilePictureUrl(newUser, 'image');
            } catch {
                ppUrl = 'https://i.imgur.com/4M34hi2.png';
            }

            const username = newUser.split('@')[0];
            const userMentionTag = `@${username}`;
            const finalCaption = customMessage
                .replace(/{usuario}/g, userMentionTag)
                .replace(/{grupo}/g, groupName)
                .replace(/{miembros}/g, totalMembers);

            await sock.sendMessage(jid, {
                image: { url: ppUrl },
                caption: finalCaption,
                mentions: [newUser]
            });
        }
    });
}
