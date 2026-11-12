const { getMessageSenderJid } = require('../../utils/messageSender');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'setpfp',
    category: 'profile',
    description: 'Cambiar tu foto de perfil personalizada.',

    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const isMedia = m.message?.imageMessage || quoted?.imageMessage;

        if (!isMedia) {
            return await sock.sendMessage(jid, { 
                text: '「✿」 FOTO DE PERFIL 🌸\n\n⚠️ Adjunta una imagen o responde a una foto con `!setpfp` para actualizar tu avatar.' 
            }, { quoted: m });
        }

        try {
            const targetMsg = quoted ? { message: quoted } : m;
            const buffer = await downloadMediaMessage(targetMsg, 'buffer', {});
            const filePath = path.join(__dirname, '../../database/pfp', `${sender.split('@')[0]}.jpg`);
            
            await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
            await fs.promises.writeFile(filePath, buffer);

            // db.updateUser(sender, { profile_image: filePath });

            await sock.sendMessage(jid, { 
                text: '「✿」 FOTO DE PERFIL ACTUALIZADA 🌸\n\n🖼️ Tu foto de perfil personalizada ha sido guardada con éxito.' 
            }, { quoted: m });
        } catch (err) {
            console.error('Error al guardar PFP:', err);
            await sock.sendMessage(jid, { 
                text: '「✿」 ERROR 🌸\n\n❌ No pude procesar la imagen enviada.' 
            }, { quoted: m });
        }
    }
};
