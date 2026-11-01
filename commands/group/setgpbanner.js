const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { checkAdmin } = require('../../utils/permissions');

module.exports = {
    name: 'setgpbanner',
    aliases: ['setgpimage', 'fotogrupo', 'setfotogrupo'],
    adminOnly: true,
    botAdminOnly: true,
    category: 'grupo',
    description: 'Cambia la imagen del grupo usando una imagen enviada o citada.',

    async execute(sock, m) {
        const jid = m.key.remoteJid;
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '「✿」 Este comando solo funciona en grupos.' }, { quoted: m });
        }
        const context = m.message?.extendedTextMessage?.contextInfo;
        const quotedMessage = context?.quotedMessage;
        const messageToDownload = m.message?.imageMessage || m.message?.videoMessage
            ? m
            : quotedMessage
                ? { key: m.key, message: quotedMessage }
                : null;
        if (!messageToDownload) {
            return sock.sendMessage(jid, { text: '「✿」 Envía o cita una imagen con !setgpbanner.' }, { quoted: m });
        }

        const sender = m.key.participant || jid;
        const { isUserAdmin, isBotAdmin } = await checkAdmin(sock, jid, sender);
        if (!isUserAdmin) {
            return sock.sendMessage(jid, { text: '「✿」 Solo los administradores del grupo pueden cambiar su imagen.' }, { quoted: m });
        }
        if (!isBotAdmin) {
            return sock.sendMessage(jid, { text: '「✿」 Necesito ser administrador para cambiar la imagen del grupo.' }, { quoted: m });
        }

        try {
            const buffer = await downloadMediaMessage(messageToDownload, 'buffer', {}, { logger: console });
            await sock.updateProfilePicture(jid, buffer);
            await sock.sendMessage(jid, { text: '「✿」 Imagen del grupo actualizada. 🌸' }, { quoted: m });
        } catch (err) {
            console.error('Error al cambiar la imagen del grupo:', err);
            await sock.sendMessage(jid, { text: '「✿」 No se pudo actualizar la imagen. Verifica que el archivo sea válido.' }, { quoted: m });
        }
    }
};
