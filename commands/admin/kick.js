const { checkAdmin } = require('../../utils/permissions');

module.exports = {
    name: 'kick_legacy',
    aliases: [],
    category: 'admin',
    description: 'Expulsa miembros del grupo mediante mención, respuesta o modos especiales.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;

        if (!jid.endsWith('@g.us')) return;

        const { isUserAdmin, isBotAdmin } = await checkAdmin(sock, jid, sender);

        if (!isUserAdmin) {
            return await sock.sendMessage(jid, { text: '⚠️ Solo los administradores pueden expulsar miembros.' }, { quoted: m });
        }
        if (!isBotAdmin) {
            return await sock.sendMessage(jid, { text: '❌ Necesito ser Administrador del grupo para poder expulsar miembros.' }, { quoted: m });
        }

        // Mención directa o respuesta a mensaje
        let targets = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (targets.length === 0 && m.message?.extendedTextMessage?.contextInfo?.participant) {
            targets.push(m.message.extendedTextMessage.contextInfo.participant);
        }

        // Si se pasa un número explícito en el texto
        if (targets.length === 0 && args.length > 0 && !isNaN(args[0])) {
            const cleanNum = args[0].replace(/[^0-9]/g, '');
            if (cleanNum.length >= 7) {
                targets.push(`${cleanNum}@s.whatsapp.net`);
            }
        }

        if (targets.length === 0) {
            return await sock.sendMessage(jid, { text: '⚠️ Debes mencionar, responder o colocar el número del usuario que deseas expulsar.' }, { quoted: m });
        }

        try {
            await sock.groupParticipantsUpdate(jid, targets, 'remove');
            const mentionsText = targets.map(t => `@${t.split('@')[0]}`).join(', ');
            await sock.sendMessage(jid, { text: `🚪 Membro(s) expulsado(s) correctamente: ${mentionsText}`, mentions: targets }, { quoted: m });
        } catch (err) {
            console.error('Error al expulsar usuario:', err);
            await sock.sendMessage(jid, { text: '❌ No se pudo completar la expulsión.' }, { quoted: m });
        }
    }
};
