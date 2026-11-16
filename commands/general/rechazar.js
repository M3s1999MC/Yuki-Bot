const { getMessageSenderJid } = require('../../utils/messageSender');
const marry = require('./marry');

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

        const user1 = novio.split('@')[0];
        const user2 = sender.split('@')[0];

        await sock.sendMessage(jid, {
            text: `「✿」 Ay nooo... 💔🥺\n\n${user2} rechazó a ${user1}... ${user1}, ven, te doy un abracito, no llores cielito (⁠｡⁠•́⁠︿⁠•̀⁠｡⁠)\n\nHabrá alguien más que sí te quiera, lo prometo 🌸`
        }, { quoted: m });
    }
};
