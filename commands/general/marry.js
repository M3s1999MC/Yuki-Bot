const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

const pending = new Map();

function isMarried(val) {
    return val && val !== 'Nadie 💔' && val !== 'Nadie' && val !== '' && val !== 'null' && val !== null;
}

module.exports = {
    name: 'marry',
    aliases: ['casar'],
    category: 'profile',
    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);

        const msg = m.message || {};
        const ctx = msg.extendedTextMessage?.contextInfo || {};
        let target = ctx.mentionedJid?.[0];

        if (!target) {
            return sock.sendMessage(jid, { text: `「✿」 ¡Oye, cielito! 🌸\n\nTienes que etiquetar a tu <user>, no escribas el @ a mano.\nEjemplo: !marry @<user>` }, { quoted: m });
        }
        if (target === sender) {
            return sock.sendMessage(jid, { text: `「✿」 Cielito, no te puedes casar contigo mismo/a 🥺🌸` }, { quoted: m });
        }

        db.getSafeUser(sender, async (err, myData) => {
            if (err || !myData) {
                return sock.sendMessage(jid, { text: `「✿」 Ay, no pude ver tu perfil, cielito 🥺` }, { quoted: m });
            }
            if (isMarried(myData.married)) {
                return sock.sendMessage(jid, { text: `「✿」 ¡Oye! Ya estás casado/a, cielito 💍\nPrimero usa !divorce y luego me pides otro !marry 🌸` }, { quoted: m });
            }

            db.getSafeUser(target, async (err2, targetData) => {
                if (err2 || !targetData) {
                    return sock.sendMessage(jid, { text: `「✿」 No pude ver el perfil de ese <user> 🥺` }, { quoted: m });
                }
                if (isMarried(targetData.married)) {
                    return sock.sendMessage(jid, { text: `「✿」 Ese <user> ya está casado/a, cielito 💔 Busca otro amorcito 🌸` }, { quoted: m });
                }
                if (pending.has(target)) {
                    return sock.sendMessage(jid, { text: `「✿」 Ya hay una propuesta pendiente para ese <user>, espera que responda 🥺` }, { quoted: m });
                }

                const timeout = setTimeout(() => {
                    pending.delete(target);
                    sock.sendMessage(jid, { text: `「✿」 La propuesta expiró... Nadie respondió 💔🌸` });
                }, 60000);
                pending.set(target, { sender, jid, timeout });

                const user1 = sender.split('@')[0];
                const user2 = target.split('@')[0];

                await sock.sendMessage(jid, {
                    text: `「✿」 ¡OMG! 💍🌸\n\n¡${user1} le está pidiendo matrimonio a ${user2}! (⁠≧⁠▽⁠≦⁠)💕\n\n${user2}, cielito, ¿te casas con ${user1}? 🥺\nResponde !aceptar si dices que sí o !rechazar si lo vas a dejar llorando... ¡Tienes 60 segundos! ⏳💔`
                }, { quoted: m });
            });
        });
    },
    pending
};
