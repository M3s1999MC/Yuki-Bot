const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'setbirthday',
    aliases: ['setbirth', 'setcumple'],
    category: 'profile',
    description: 'Establecer tu fecha de cumpleaños en el perfil.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const birthday = args[0];

        if (!birthday) {
            return await sock.sendMessage(jid, { 
                text: '「✿」 FECHA DE CUMPLEAÑOS 🌸\n\n⚠️ Indica tu fecha en formato DD/MM/AAAA.\n*Uso:* `!setbirthday 25/12/1998`' 
            }, { quoted: m });
        }

        // db.updateUser(sender, { birthday });
        await sock.sendMessage(jid, { 
            text: `「✿」 CUMPLEAÑOS REGISTRADO 🌸\n\n🎂 Tu fecha de nacimiento ha sido establecida como: *${birthday}*.` 
        }, { quoted: m });
    }
};
