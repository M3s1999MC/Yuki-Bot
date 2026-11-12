const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'setname',
    aliases: ['setnombreperfil'],
    category: 'profile',
    description: 'Cambiar el nombre que aparece en tu perfil.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const custom_name = args.join(' ');

        if (!custom_name) {
            return await sock.sendMessage(jid, { 
                text: '「✿」 NOMBRE DE PERFIL 🌸\n\n⚠️ Escribe el nombre que deseas mostrar.\n*Uso:* `!setname <nombre>`' 
            }, { quoted: m });
        }

        // db.updateUser(sender, { custom_name });
        await sock.sendMessage(jid, { 
            text: `「✿」 NOMBRE ACTUALIZADO 🌸\n\n✨ Tu nombre de perfil ahora es: *${custom_name}*.` 
        }, { quoted: m });
    }
};
