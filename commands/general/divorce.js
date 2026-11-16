const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

async function guardar(userId, valor) {
    if (db.updateUser) return db.updateUser(userId, { married: valor });
    if (db.updateUserData) return db.updateUserData(userId, { married: valor });
    if (db.setUser) return db.setUser(userId, { married: valor });
}

module.exports = {
    name: 'divorce',
    aliases: ['divorcio'],
    category: 'profile',
    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);

        db.getSafeUser(sender, async (err, data) => {
            if (!data.married) {
                return sock.sendMessage(jid, { text: `「✿」 Cielito, no estás casado/a con nadie 💔 Ya estás solterito 🌸` }, { quoted: m });
            }
            const ex = data.married;
            await guardar(sender, null);
            await guardar(ex, null);

            const user1 = sender.split('@')[0];
            const user2 = ex.split('@')[0];

            await sock.sendMessage(jid, {
                text: `「✿」 Divorcio... 💔\n\nAy, qué triste, ${user1} y ${user2} ya no son pareja...\n\nEspero que hayan sido felices mientras duró, cielitos 🌸 Ya pueden volver a enamorarse con !marry`
            }, { quoted: m });
        });
    }
};
