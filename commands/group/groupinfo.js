module.exports = {
    name: 'groupinfo',
    aliases: ['gp', 'infogrupo', 'infogc'],
    category: 'group',
    description: 'Muestra información detallada del grupo.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        if (!jid.endsWith('@g.us')) {
            return await sock.sendMessage(jid, { text: '⚠️ Este comando solo se puede usar en grupos.' }, { quoted: m });
        }

        try {
            const metadata = await sock.groupMetadata(jid);
            const caption = `「✿D」 Información del Grupo ◢ ${metadata.subject} ◤\n\n` +
                            `👥 Miembros: *${metadata.participants.length}*\n` +
                            `👑 Creador: @${metadata.owner?.split('@')[0] || 'Desconocido'}\n` +
                            `📝 Descripción:\n_${metadata.desc || 'Sin descripción'}_`;

            await sock.sendMessage(jid, { text: caption, mentions: metadata.owner ? [metadata.owner] : [] }, { quoted: m });
        } catch (err) {
            console.error(err);
            await sock.sendMessage(jid, { text: '❌ No se pudo obtener la información del grupo.' }, { quoted: m });
        }
    }
};