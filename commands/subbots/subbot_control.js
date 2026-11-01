module.exports = {
    name: 'reload',
    aliases: ['logout', 'self'],
    category: 'subbot',
    description: 'Control avanzado de sub-bots, uniones a grupos y depuración.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;
        const body = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const commandUsed = body.slice(1).trim().split(/ +/)[0].toLowerCase();

        // 1. Depuración de JID (!numdebug)
        if (['numdebug', 'jiddebug', 'debugnum'].includes(commandUsed)) {
            const debugText = `🔍 *DEBUG DE JID*\n\n` +
                              `> Remitente crudo: \`${sender}\`\n` +
                              `> Chat JID: \`${jid}\`\n` +
                              `> Es grupo: ${jid.endsWith('@g.us') ? 'Sí' : 'No'}`;
            return await sock.sendMessage(jid, { text: debugText }, { quoted: m });
        }

        // 2. Unirse a grupo mediante enlace (!join)
        if (['join', 'unir'].includes(commandUsed)) {
            const inviteLink = args[0];
            if (!inviteLink || !inviteLink.includes('chat.whatsapp.com')) {
                return await sock.sendMessage(jid, { text: '⚠️ Por favor, proporciona un enlace de invitación de WhatsApp válido.' }, { quoted: m });
            }
            try {
                const code = inviteLink.split('chat.whatsapp.com/')[1];
                await sock.groupAcceptInvite(code);
                await sock.sendMessage(jid, { text: '✅ ¡Me he unido exitosamente al grupo mediante el enlace!' }, { quoted: m });
            } catch (err) {
                await sock.sendMessage(jid, { text: '❌ No pude unirme al grupo. Es posible que el enlace haya expirado o el bot esté bloqueado.' }, { quoted: m });
            }
            return;
        }

        // 3. Salir de grupo (!leave)
        if (['leave', 'salir'].includes(commandUsed)) {
            if (!jid.endsWith('@g.us')) {
                return await sock.sendMessage(jid, { text: '❌ Este comando solo se puede usar dentro de grupos.' }, { quoted: m });
            }
            try {
                await sock.sendMessage(jid, { text: '👋 ¡Adiós a todos! Saliendo del grupo...' });
                await sock.groupLeave(jid);
            } catch (err) {
                await sock.sendMessage(jid, { text: '❌ Ocurrió un error al intentar salir del grupo.' }, { quoted: m });
            }
            return;
        }

        // 4. Modo Self (!self)
        if (commandUsed === 'self') {
            await sock.sendMessage(jid, { text: '🔒 Modo Self alternado. El bot ahora responde solo a su propietario (función simulada).' }, { quoted: m });
            return;
        }

        // 5. Reload / Logout
        if (['reload', 'logout'].includes(commandUsed)) {
            await sock.sendMessage(jid, { text: `🔄 Acción *${commandUsed.toUpperCase()}* procesada para la sesión actual.` }, { quoted: m });
        }
    }
};