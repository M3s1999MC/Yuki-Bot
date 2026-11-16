const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');
const marry = require('./marry');

function getNombre(jid, fallback) {
    return new Promise((resolve) => {
        db.getSafeUser(jid, (err, data) => {
            const nombre = data?.name;
            if (nombre && nombre !== 'Usuario' && !/^\d+$/.test(nombre)) {
                return resolve(nombre);
            }
            return resolve(fallback || jid.split('@')[0]);
        });
    });
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
            return sock.sendMessage(jid, { text: `「✿」 Cielito, no tienes ninguna propuesta pendiente 🥺\nQue te hagan !marry etiquetándote primero 🌸` }, { quoted: m });
        }

        const novio = propuesta.sender;
        clearTimeout(propuesta.timeout);
        marry.pending.delete(sender);

        db.updateUser(novio, { married: sender }, () => {});
        db.updateUser(sender, { married: novio }, () => {});

        const nombre1 = await getNombre(novio, null);
        const nombre2 = await getNombre(sender, m.pushName);

        await sock.sendMessage(jid, {
            text: `「✿」 ¡¡SE CASARON!! 💍✨🌸\n\n¡Qué lindos! ${nombre1} y ${nombre2} ahora son esposos! (⁠♡⁠ω⁠♡⁠) 💕\n\nYa les puse su anillito en el !profile, vayan a presumirlo, bebés! 💒`
        }, { quoted: m });
    }
};
