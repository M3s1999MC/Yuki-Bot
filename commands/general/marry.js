const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

const pending = new Map();

module.exports = {
    name: 'marry',
    aliases: ['casar'],
    category: 'profile',
    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);

        const msg = m.message || {};
        const ext = msg.extendedTextMessage || {};
        const ctx = ext.contextInfo || {};
        let target = ctx.mentionedJid?.[0];

        if (!target || target === sender) {
            return sock.sendMessage(jid, {
                text: '「✿」 PROPUESTA DE MATRIMONIO 🌸\n\nTienes que ETIQUETAR a la persona.\nEjemplo: !marry @M'
            }, { quoted: m });
        }

        // FIX: el callback tiene que ser async para poder usar await adentro
        db.getSafeUser(sender, async (err, senderData) => {
            if (err) return sock.sendMessage(jid, { text: 'Error con tu perfil.' }, { quoted: m });
            if (senderData.married) {
                return sock.sendMessage(jid, { text: 'Ya estás casado/a, usa !divorce primero.' }, { quoted: m });
            }

            // FIX: este callback también async
            db.getSafeUser(target, async (err2, targetData) => {
                if (err2) return sock.sendMessage(jid, { text: 'Error con el perfil de esa persona.' }, { quoted: m });
                if (targetData.married) {
                    return sock.sendMessage(jid, { text: 'Esa persona ya está casada.' }, { quoted: m });
                }
                if (pending.has(target)) {
                    return sock.sendMessage(jid, { text: 'Ya hay una propuesta pendiente para esa persona.' }, { quoted: m });
                }

                const timeout = setTimeout(() => {
                    pending.delete(target);
                    sock.sendMessage(jid, { text: 'La propuesta expiró, nadie respondió. 💔' });
                }, 60000);
                pending.set(target, { sender, jid, timeout });

                const numSender = sender.split('@')[0];
                const numTarget = target.split('@')[0];

                await sock.sendMessage(jid, {
                    text: `「✿」 ¡PROPUESTA ENVIADA! 🌸\n\n💍 ${numSender} le ha propuesto matrimonio a ${numTarget}! 💕\n\n${numTarget}, responde !aceptar para aceptar o !rechazar para rechazar. Tienes 60 segundos.`
                }, { quoted: m });
            });
        });
    },
    pending
};
