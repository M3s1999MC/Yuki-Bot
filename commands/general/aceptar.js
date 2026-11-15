const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');
const marry = require('./marry');

module.exports = {
    name: 'aceptar',
    aliases: ['yes', 'si', 'accept'],
    category: 'profile',
    description: 'Aceptar propuesta de matrimonio.',
    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const propuesta = marry.pending.get(sender);

        if (!propuesta) {
            return sock.sendMessage(jid, { text: '「✿」 No tienes ninguna propuesta de matrimonio pendiente.' }, { quoted: m });
        }

        clearTimeout(propuesta.timeout);
        marry.pending.delete(sender);
        const esposo = propuesta.sender;

        // GUARDADO COMPATIBLE CON TU PROFILE.JS:
        // married = JID de la pareja, no true/false
        if (db.updateUser) {
            db.updateUser(esposo, { married: sender });
            db.updateUser(sender, { married: esposo });
        } else {
            // Si tu db no tiene updateUser, dime cómo se llama y te lo cambio
            // pero tiene que quedar married = JID
        }

        sock.sendMessage(jid, {
            text: `「✿」 ¡SE CASARON! 💍🌸\n\n💕 @${esposo.split('@')[0]} y @${sender.split('@')[0]} ahora son esposos! ¡Felicidades!\n\nYa pueden verlo con *!profile*`,
            mentions: [esposo, sender]
        }, { quoted: m });
    }
};
