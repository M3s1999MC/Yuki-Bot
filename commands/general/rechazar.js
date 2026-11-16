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

        await sock.sendMessage(jid, {
            text: `「✿」 Ay nooo... 💔🥺\n\n@${sender.split('@')[0]} rechazó a @${novio.split('@')[0]}... @${novio.split('@')[0]}, ven, te doy un abracito, no llores cielito (⁠｡⁠•́⁠︿⁠•̀⁠｡⁠)\n\nHabrá alguien más que sí te quiera, lo prometo 🌸`,
            mentions: [sender, novio]
        }, { quoted: m });
    }
};
