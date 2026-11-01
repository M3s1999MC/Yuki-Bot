const { checkAdmin } = require('../../utils/permissions');

module.exports = {
    name: 'group_mod_legacy',
    aliases: [],
    category: 'admin',
    description: 'Gestión básica y moderación de miembros/ajustes del grupo.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;

        if (!jid.endsWith('@g.us')) {
            return await sock.sendMessage(jid, { text: '❌ Este comando solo se puede usar dentro de grupos.' }, { quoted: m });
        }

        const body = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const prefix = '.';
        const commandUsed = body.slice(prefix.length).trim().split(/ +/)[0].toLowerCase();

        const { isUserAdmin, isBotAdmin } = await checkAdmin(sock, jid, sender);

        if (!isUserAdmin) {
            return await sock.sendMessage(jid, { text: '⚠️ Necesitas ser *Administrador* para usar este comando.' }, { quoted: m });
        }

        // --- APERTURA / CIERRE DEL GRUPO ---
        if (['close', 'cerrar'].includes(commandUsed)) {
            if (!isBotAdmin) return await sock.sendMessage(jid, { text: '❌ Necesito ser administrador para cambiar la configuración del grupo.' }, { quoted: m });
            await sock.groupSettingUpdate(jid, 'announcement');
            return await sock.sendMessage(jid, { text: '🔒 Grupo cerrado. Ahora solo los administradores pueden enviar mensajes.' }, { quoted: m });
        }

        if (['open', 'abrir'].includes(commandUsed)) {
            if (!isBotAdmin) return await sock.sendMessage(jid, { text: '❌ Necesito ser administrador para cambiar la configuración del grupo.' }, { quoted: m });
            await sock.groupSettingUpdate(jid, 'not_announcement');
            return await sock.sendMessage(jid, { text: '🔓 Grupo abierto. Todos los miembros pueden escribir.' }, { quoted: m });
        }

        // --- ENLACE Y RESTABLECIMIENTO ---
        if (['link', 'enlace', 'invite'].includes(commandUsed)) {
            if (!isBotAdmin) return await sock.sendMessage(jid, { text: '❌ Necesito ser administrador para obtener el enlace de invitación.' }, { quoted: m });
            const code = await sock.groupInviteCode(jid);
            return await sock.sendMessage(jid, { text: `🔗 *Enlace del grupo:*\nhttps://chat.whatsapp.com/${code}` }, { quoted: m });
        }

        if (['revoke', 'restablecer'].includes(commandUsed)) {
            if (!isBotAdmin) return await sock.sendMessage(jid, { text: '❌ Necesito ser administrador para restablecer el enlace.' }, { quoted: m });
            await sock.groupRevokeInvite(jid);
            return await sock.sendMessage(jid, { text: '🔄 El enlace de invitación del grupo ha sido restablecido con éxito.' }, { quoted: m });
        }

        // --- PROMOCIÓN Y DEGRADACIÓN ---
        if (['promote', 'promover', 'admin', 'demote', 'degradar'].includes(commandUsed)) {
            if (!isBotAdmin) return await sock.sendMessage(jid, { text: '❌ Necesito ser administrador para modificar roles de miembros.' }, { quoted: m });
            
            const targetJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                              m.message?.extendedTextMessage?.contextInfo?.participant;

            if (!targetJid) return await sock.sendMessage(jid, { text: '⚠️ Menciona o responde al mensaje de un miembro.' }, { quoted: m });

            const action = ['promote', 'promover', 'admin'].includes(commandUsed) ? 'promote' : 'demote';
            await sock.groupParticipantsUpdate(jid, [targetJid], action);

            const msg = action === 'promote' 
                ? `✨ @${targetJid.split('@')[0]} ahora es Administrador del grupo.`
                : `🔻 @${targetJid.split('@')[0]} ya no es Administrador.`;

            return await sock.sendMessage(jid, { text: msg, mentions: [targetJid] }, { quoted: m });
        }

        // --- CAMBIAR NOMBRE O DESCRIPCIÓN ---
        if (['setgpname', 'nombregrupo', 'setnombregrupo'].includes(commandUsed)) {
            if (!isBotAdmin) return await sock.sendMessage(jid, { text: '❌ Necesito ser administrador para cambiar el nombre del grupo.' }, { quoted: m });
            const text = args.join(' ');
            if (!text) return await sock.sendMessage(jid, { text: '⚠️ Especifica el nuevo nombre para el grupo.' }, { quoted: m });
            await sock.groupUpdateSubject(jid, text);
            return await sock.sendMessage(jid, { text: '✅ Nombre del grupo actualizado.' }, { quoted: m });
        }

        if (['setgpdesc', 'descripciongrupo', 'setdescripciongrupo'].includes(commandUsed)) {
            if (!isBotAdmin) return await sock.sendMessage(jid, { text: '❌ Necesito ser administrador para cambiar la descripción.' }, { quoted: m });
            const text = args.join(' ');
            if (!text) return await sock.sendMessage(jid, { text: '⚠️ Especifica la nueva descripción.' }, { quoted: m });
            await sock.groupUpdateDescription(jid, text);
            return await sock.sendMessage(jid, { text: '✅ Descripción del grupo actualizada.' }, { quoted: m });
        }
    }
};