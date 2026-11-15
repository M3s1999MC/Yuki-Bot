const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

const pending = new Map();

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
                text: '「✿」 PROPUESTA DE MATRIMONIO 🌸\n\n⚠️ Debes mencionar al usuario con quien deseas casarte.\nEjemplo: !marry @M' 
            }, { quoted: m });
        }

        db.getSafeUser(sender, (err, senderData) => {
            if (err) {
                return sock.sendMessage(jid, { text: '「✿」 MATRIMONIO 🌸\n\n❌ Ocurrió un error con tu perfil.' }, { quoted: m });
            }
            // AQUÍ ESTÁ EL ARREGLO: married es un JID, no un true/false
            if (senderData.married) {
                return sock.sendMessage(jid, { 
                    text: `「✿」 MATRIMONIO 🌸\n\n❌ Ya estás casado/a con @${senderData.married.split('@')[0]}.\nSi quieres casarte con otra persona, primero usa *!divorce*`,
                    mentions: [senderData.married]
                }, { quoted: m });
            }

            db.getSafeUser(target, (errTarget, targetData) => {
                if (errTarget) {
                    return sock.sendMessage(jid, { text: '「✿」 MATRIMONIO 🌸\n\n❌ Ocurrió un error con el perfil de esa persona.' }, { quoted: m });
                }
                if (targetData.married) {
                    return sock.sendMessage(jid, { 
                        text: `「✿」 MATRIMONIO 🌸\n\n❌ @${target.split('@')[0]} ya está casado/a con @${targetData.married.split('@')[0]}.`,
                        mentions: [target, targetData.married]
                    }, { quoted: m });
                }

                if (pending.has(target)) {
                    return sock.sendMessage(jid, { text: '「✿」 Ya hay una propuesta pendiente para esa persona, espera a que responda.' }, { quoted: m });
                }

                const timeout = setTimeout(() => {
                    pending.delete(target);
                    sock.sendMessage(jid, { text: `「✿」 La propuesta de @${sender.split('@')[0]} a @${target.split('@')[0]} expiró, nadie respondió. 💔`, mentions: [sender, target] });
                }, 60000);
                pending.set(target, { sender, jid, timeout });

                sock.sendMessage(jid, {
                    text: `「✿」 ¡PROPUESTA ENVIADA! 🌸\n\n💍 @${sender.split('@')[0]} le ha propuesto matrimonio a @${target.split('@')[0]}! 💕\n\n@${target.split('@')[0]}, responde *!aceptar* para aceptar o *!rechazar* para rechazar. Tienes 60 segundos.`,
                    mentions: [sender, target]
                }, { quoted: m });
            });
        });
    },
    pending
};
