const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'divorciar',
    aliases: ['divorce'],
    category: 'profile',
    description: 'Separarte de tu pareja actual.',

    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);

        db.getSafeUser(sender, (err, data) => {
            if (err || !data.married) {
                return sock.sendMessage(jid, { 
                    text: '「✿」 DIVORCIO 🌸\n\n❌ No estás casado/a con nadie actualmente.' 
                }, { quoted: m });
            }

            sock.sendMessage(jid, {
                text: `「✿」 REGISTRO CIVIL - DIVORCIO 🌸\n\n💔 @${sender.split('@')[0]} se ha divorciado. Ahora estás soltero/a.`,
                mentions: [sender]
            }, { quoted: m });
        });
    }
};
