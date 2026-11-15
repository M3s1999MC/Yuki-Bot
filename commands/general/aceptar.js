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
        const sender = getMessageSenderJid(m, sock); // el que acepta = el target
        const propuesta = marry.pending.get(sender);

        if (!propuesta) {
            return sock.sendMessage(jid, { text: '「✿」 No tienes ninguna propuesta de matrimonio pendiente.' }, { quoted: m });
        }

        clearTimeout(propuesta.timeout);
        marry.pending.delete(sender);

        const esposo = propuesta.sender;

        // Guardar casados en ambos perfiles
        db.getSafeUser(esposo, (e1, d1) => {
            db.getSafeUser(sender, (e2, d2) => {
                // Aquí depende de como tu db guarda, esto es lo estándar:
                // Si tu db usa updateUser o save, cambia estas 2 líneas
                if (db.updateUser) {
                    db.updateUser(esposo, { married: true, marriedTo: sender });
                    db.updateUser(sender, { married: true, marriedTo: esposo });
                } else if (db.setMarried) {
                    db.setMarried(esposo, sender);
                    db.setMarried(sender, esposo);
                }

                sock.sendMessage(jid, {
                    text: `「✿」 ¡SE CASARON! 💍🌸\n\n💕 @${esposo.split('@')[0]} y @${sender.split('@')[0]} ahora son esposos! ¡Felicidades!`,
                    mentions: [esposo, sender]
                }, { quoted: m });
            });
        });
    }
};
