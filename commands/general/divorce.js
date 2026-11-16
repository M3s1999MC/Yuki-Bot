const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

function isMarried(val) {
    return val && val !== 'Nadie 💔' && val !== 'Nadie' && val !== '' && val !== 'null' && val !== null;
}

module.exports = {
    name: 'divorce',
    aliases: ['divorcio'],
    category: 'profile',
    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);

        db.getSafeUser(sender, async (err, data) => {
            if (err || !data || !isMarried(data.married)) {
                return sock.sendMessage(jid, { text: `「✿」 Cielito, no estás casado/a con nadie 💔 Ya estás solterito 🌸` }, { quoted: m });
            }

            const ex = data.married;
            db.updateUser(sender, { married: 'Nadie 💔' }, () => {});
            db.updateUser(ex, { married: 'Nadie 💔' }, () => {});

            await sock.sendMessage(jid, {
                text: `「✿」 Divorcio... 💔\n\nAy, qué triste, @${sender.split('@')[0]} y @${ex.split('@')[0]} ya no son pareja...\n\nEspero que hayan sido felices mientras duró, cielitos 🌸 Ya pueden volver a enamorarse con !marry`,
                mentions: [sender, ex]
            }, { quoted: m });
        });
    }
};
