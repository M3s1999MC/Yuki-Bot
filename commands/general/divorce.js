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
            if (err) return sock.sendMessage(jid, { text: 'Error con tu perfil.' }, { quoted: m });

            console.log('DIVORCE DEBUG - soy:', sender, 'married:', data.married);

            if (!data.married) {
                return sock.sendMessage(jid, { text: 'No estás casado/a con nadie, no tienes de quién divorciarte.' }, { quoted: m });
            }

            const ex = data.married;

            // Borra en los 2, con null Y con string vacío, para que no quede nada
            // Tu profile revisa data.married, si queda algo ahí, te sigue saliendo casado
            if (db.updateUser) {
                await db.updateUser(sender, { married: null });
                await db.updateUser(ex, { married: null });
            } else if (db.updateUserData) {
                await db.updateUserData(sender, { married: null });
                await db.updateUserData(ex, { married: null });
            } else {
                // Si tu db no tiene updateUser, dime cómo se llama
                console.log('DIVORCE: no hay updateUser en db.js');
            }

            await sock.sendMessage(jid, {
                text: `「✿」 DIVORCIO 💔\n\nTe divorciaste de ${ex.split('@')[0]}. Ya puedes volver a casarte con !marry @M`
            }, { quoted: m });
        });
    }
};
