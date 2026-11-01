module.exports = {
    name: 'demote',
    aliases: ['quitaradmin', 'quitarpoder'],
    adminOnly: true,
    botAdminOnly: true,
    category: 'grupo',
    description: 'Quita la administracion a un miembro del grupo.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;

        if (!jid.endsWith('@g.us')) {
            return await sock.sendMessage(jid, { text: '⚠️ Este comando solo puede ser usado en grupos.' }, { quoted: m });
        }

        const groupMetadata = await sock.groupMetadata(jid);
        const participants = groupMetadata.participants;

        const groupAdmins = participants.filter(p => p.admin !== null).map(p => p.id);
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const sender = m.key.participant || m.key.remoteJid;

        if (!groupAdmins.includes(botId)) {
            return await sock.sendMessage(jid, { text: '❌ Necesito ser Administrador del grupo para realizar esta acción.' }, { quoted: m });
        }

        if (!groupAdmins.includes(sender)) {
            return await sock.sendMessage(jid, { text: '❌ Este comando es exclusivo para administradores del grupo.' }, { quoted: m });
        }

        let target;
        if (m.message?.extendedTextMessage?.contextInfo?.participant) {
            target = m.message.extendedTextMessage.contextInfo.participant;
        } else if (m.mentionedJid && m.mentionedJid[0]) {
            target = m.mentionedJid[0];
        } else if (args[0] && !isNaN(args[0])) {
            target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        }

        if (!target) {
            return await sock.sendMessage(jid, { text: '⚠️ Menciona a un usuario o responde a su mensaje para quitarle el cargo.' }, { quoted: m });
        }

        try {
            await sock.groupParticipantsUpdate(jid, [target], 'demote');
            await sock.sendMessage(jid, { text: `📉 @${target.split('@')[0]} ya no es administrador del grupo.`, mentions: [target] }, { quoted: m });
        } catch (err) {
            console.error('Error en demote.js:', err);
            await sock.sendMessage(jid, { text: '❌ Ocurrió un error al intentar degradar al usuario.' }, { quoted: m });
        }
    }
};