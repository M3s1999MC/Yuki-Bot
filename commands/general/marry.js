const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'marry',
    aliases: ['casar'],
    category: 'profile',
    description: 'Proponerle matrimonio a otro usuario.',

    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

        if (!target || target === sender) {
            return await sock.sendMessage(jid, { 
                text: '「✿」 PROPUESTA DE MATRIMONIO 🌸\n\n⚠️ Debes mencionar al usuario con quien deseas casarte.' 
            }, { quoted: m });
        }

        db.getSafeUser(sender, (err, senderData) => {
            if (err || senderData.married) {
                return sock.sendMessage(jid, { 
                    text: '「✿」 MATRIMONIO 🌸\n\n❌ Ya estás casado/a con otra persona o ocurrió un error.' 
                }, { quoted: m });
            }

            db.getSafeUser(target, (errTarget, targetData) => {
                if (errTarget || targetData.married) {
                    return sock.sendMessage(jid, { 
                        text: '「✿」 MATRIMONIO 🌸\n\n❌ El usuario mencionado ya está casado con alguien más.' 
                    }, { quoted: m });
                }

                sock.sendMessage(jid, {
                    text: `「✿」 ¡PROPUESTA ENVIADA! 🌸\n\n💍 @${sender.split('@')[0]} le ha propuesto matrimonio a @${target.split('@')[0]}! 💕`,
                    mentions: [sender, target]
                }, { quoted: m });
            });
        });
    }
};
