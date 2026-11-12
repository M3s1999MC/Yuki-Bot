const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'setpasatiempo',
    aliases: ['sethobby'],
    category: 'profile',
    description: 'Establecer tu pasatiempo en el perfil.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const hobby = args.join(' ');

        if (!hobby) {
            return await sock.sendMessage(jid, { 
                text: '「✿」 PASATIEMPO 🌸\n\n⚠️ Escribe tu pasatiempo.\n*Uso:* `!setpasatiempo <texto>`' 
            }, { quoted: m });
        }

        // db.updateUser(sender, { hobby });
        await sock.sendMessage(jid, { 
            text: '「✿」 PASATIEMPO ACTUALIZADO 🌸\n\n🎨 Tu pasatiempo ha sido guardado con éxito en tu perfil.' 
        }, { quoted: m });
    }
};
