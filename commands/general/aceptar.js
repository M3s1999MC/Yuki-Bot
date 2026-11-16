const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');
const marry = require('./marry');

module.exports = {
    name: 'aceptar',
    aliases: ['accept'],
    category: 'profile',
    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);

        const propuesta = marry.pending.get(sender);
        if (!propuesta) {
            return sock.sendMessage(jid, { text: `「✿」 Cielito, no tienes ninguna propuesta pendiente 🥺\nQue te hagan !marry etiquetándote primero 🌸` }, { quoted: m });
        }

        const novio = propuesta.sender;
        clearTimeout(propuesta.timeout);
        marry.pending.delete(sender);

        db.updateUser(novio, { married: sender }, () => {});
        db.updateUser(sender, { married: novio }, () => {});

        await sock.sendMessage(jid, {
            text: `「✿」 ¡¡SE CASARON!! 💍✨🌸\n\n¡Qué lindos! @${novio.split('@')[0]} y @${sender.split('@')[0]} ahora son esposos! (⁠♡⁠ω⁠♡⁠) 💕\n\nYa les puse su anillito en el !profile, vayan a presumirlo, bebés! 💒`,
            mentions: [novio, sender]
        }, { quoted: m });
    }
};
