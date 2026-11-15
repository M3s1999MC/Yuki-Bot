export async function before(m, { conn }) {
    // Validar que sea un grupo y que el evento corresponda a un nuevo miembro (StubType 27)
    if (!m.isGroup) return;
    if (m.messageStubType !== 27) return; 

    const jid = m.chat;
    const chatData = global.db?.data?.chats?.[jid] || {};
    const customMessage = chatData.welcomeMessage;

    // Si no hay mensaje configurado, no hace nada
    if (!customMessage) return;

    let groupMetadata;
    try {
        groupMetadata = await conn.groupMetadata(jid);
    } catch {
        return;
    }

    const groupName = groupMetadata.subject;
    const totalMembers = groupMetadata.participants.length;

    // m.messageStubParameters contiene los JIDs de los usuarios que entraron
    for (let newUser of m.messageStubParameters) {
        let ppUrl;
        try {
            ppUrl = await conn.profilePictureUrl(newUser, 'image');
        } catch {
            ppUrl = 'https://i.imgur.com/4M34hi2.png';
        }

        const userMentionTag = `@${newUser.split('@')[0]}`;
        const finalCaption = customMessage
            .replace(/{usuario}/g, userMentionTag)
            .replace(/{grupo}/g, groupName)
            .replace(/{miembros}/g, totalMembers);

        await conn.sendMessage(jid, {
            image: { url: ppUrl },
            caption: finalCaption,
            mentions: [newUser]
        });
    }
}
