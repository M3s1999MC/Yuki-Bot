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
    name: 'rechazar',
    aliases: ['reject'],
    category: 'profile',
    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);

        const propuesta = marry.pending.get(sender);
        if (!propuesta) {
            return sock.sendMessage(jid, { text: `「✿」 No tienes nada que rechazar, cielito 🌸` }, { quoted: m });
        }

        const novio = propuesta.sender;
        clearTimeout(propuesta.timeout);
        marry.pending.delete(sender);

        const nombre1 = await getNombre(novio, null);
        const nombre2 = await getNombre(sender, m.pushName);

        await sock.sendMessage(jid, {
            text: `「✿」 Ay nooo... 💔🥺\n\n${nombre2} rechazó a ${nombre1}... ${nombre1}, ven, te doy un abracito, no llores cielito (⁠｡⁠•́⁠︿⁠•̀⁠｡⁠)\n\nHabrá alguien más que sí te quiera, lo prometo 🌸`
        }, { quoted: m });
    }
};
