async function checkAdmin(sock, groupJid, userJid) {
    try {
        const metadata = await sock.groupMetadata(groupJid);
        const participants = metadata.participants || [];
        const findParticipant = (jid) => participants.find(p =>
            [p.id, p.jid, p.lid, p.phoneNumber].filter(Boolean).includes(jid)
        );
        const isAdmin = (participant) => ['admin', 'superadmin'].includes(participant?.admin);
        const userAdmin = isAdmin(findParticipant(userJid));
        const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const botAdmin = isAdmin(findParticipant(botJid));

        return { isUserAdmin: !!userAdmin, isBotAdmin: !!botAdmin, metadata };
    } catch (error) {
        console.error('Error al verificar administradores:', error);
        return { isUserAdmin: false, isBotAdmin: false, metadata: null };
    }
}

module.exports = { checkAdmin };