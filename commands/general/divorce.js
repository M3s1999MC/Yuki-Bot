const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'divorce',
    aliases: ['divorcio'],
    category: 'profile',
    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);

        db.getSafeUser(sender, async (err, data) => {
            console.log('DIVORCE DEBUG - data.married:', data.married);
            if (!data.married) {
                return sock.sendMessage(jid, { text: 'No estás casado/a, tu profile ya está en Nadie.' }, { quoted: m });
            }
            const ex = data.married;
            const guardar = async (id, val) => {
                if (db.updateUser) return db.updateUser(id, { married: val });
                if (db.setUser) return db.setUser(id, { married: val });
                if (db.updateUserData) return db.updateUserData(id, { married: val });
            };
            await guardar(sender, null);
            await guardar(ex, null);
            await sock.sendMessage(jid, { text: `Te divorciaste de ${ex.split('@')[0]} 💔 Ya puedes casarte de nuevo.` }, { quoted: m });
        });
    }
};
