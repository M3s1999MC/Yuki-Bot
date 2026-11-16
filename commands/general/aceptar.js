const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');
const marry = require('./marry');

async function guardar(userId, pareja) {
    if (db.updateUser) return db.updateUser(userId, { married: pareja });
    if (db.updateUserData) return db.updateUserData(userId, { married: pareja });
    if (db.setUser) return db.setUser(userId, { married: pareja });
    console.log('ACEPTAR: no hay función para guardar en db.js');
}

module.exports = {
    name: 'aceptar',
    aliases: ['accept'],
    category: 'profile',
    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);

        const propuesta = marry.pending.get(sender);
        if (!propuesta) {
            return sock.sendMessage(jid, { text: `「✿」 Cielito, no tienes ninguna propuesta pendiente 🥺\nQue te hagan !marry @<user> primero 🌸` }, { quoted: m });
        }

        const novio = propuesta.sender;
        clearTimeout(propuesta.timeout);
        marry.pending.delete(sender);

        await guardar(novio, sender);
        await guardar(sender, novio);

        const user1 = novio.split('@')[0];
        const user2 = sender.split('@')[0];

        await sock.sendMessage(jid, {
            text: `「✿」 ¡¡SE CASARON!! 💍✨🌸\n\n¡Qué lindos! ${user1} y ${user2} ahora son esposos! (⁠♡⁠ω⁠♡⁠) 💕\n\nYa les puse su anillito en el !profile, vayan a presumirlo, bebés! 💒`
        }, { quoted: m });
    }
};
