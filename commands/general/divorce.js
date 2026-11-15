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
            const ex = data.marriedTo;
            if (db.updateUser) {
                db.updateUser(sender, { married: false, marriedTo: null });
                if (ex) db.updateUser(ex, { married: false, marriedTo: null });
            }
            sock.sendMessage(jid, {
                text: `「✿」 DIVORCIO 💔\n\n@${sender.split('@')[0]} se divorció ${ex ? `de @${ex.split('@')[0]}` : ''}. Ya puedes volver a casarte.`,
                mentions: ex ? [sender, ex] : [sender]
            }, { quoted: m });
        });
    }
};
