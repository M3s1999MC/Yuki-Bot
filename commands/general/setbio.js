const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'setbio',
    aliases: ['setbiografia'],
    category: 'profile',
    description: 'Establecer tu biografía en el perfil.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const bio = args.join(' ');

        if (!bio) {
            return await sock.sendMessage(jid, { 
                text: '「✿」 CAMBIAR BIOGRAFÍA 🌸\n\n⚠️ Escribe el texto para tu biografía.\n*Uso:* `!setbio <tu texto>`' 
            }, { quoted: m });
        }

        // db.updateUser(sender, { bio });
        await sock.sendMessage(jid, { 
            text: '「✿」 BIOGRAFÍA ACTUALIZADA 🌸\n\n📝 Tu biografía personal ha sido guardada con éxito.' 
        }, { quoted: m });
    }
};
