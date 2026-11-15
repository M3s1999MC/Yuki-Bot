const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'divorce',
    aliases: ['divorcio'],
    category: 'profile',
    description: 'Divorciarte de tu pareja actual.',
    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);

        db.getSafeUser(sender, (err, data) => {
            if (err || !data.married) {
                return sock.sendMessage(jid, { text: '「✿」 No estás casado/a con nadie, no tienes de quién divorciarte.' }, { quoted: m });
            }
            const ex = data.married;
            if (db.updateUser) {
                db.updateUser(sender, { married: null });
                db.updateUser(ex, { married: null });
            }
            sock.sendMessage(jid, {
                text: `「✿」 DIVORCIO 💔\n\n@${sender.split('@')[0]} se divorció de @${ex.split('@')[0]}. Ya puedes volver a casarte.`,
                mentions: [sender, ex]
            }, { quoted: m });
        });
    }
};
