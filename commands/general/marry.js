const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

// Guardamos propuestas pendientes en memoria: targetJid -> { sender, jid, timeout }
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
            // Si ya está casado, decir CON QUIÉN
            if (senderData.married) {
                const pareja = senderData.marriedTo ? `@${senderData.marriedTo.split('@')[0]}` : 'alguien';
                return sock.sendMessage(jid, { 
                    text: `「✿」 MATRIMONIO 🌸\n\n❌ Ya estás casado/a con ${pareja}.\nSi quieres casarte con otra persona, primero usa *!divorce*`,
                    mentions: senderData.marriedTo ? [senderData.marriedTo] : []
                }, { quoted: m });
            }

            db.getSafeUser(target, (errTarget, targetData) => {
                if (errTarget) {
                    return sock.sendMessage(jid, { text: '「✿」 MATRIMONIO 🌸\n\n❌ Ocurrió un error con el perfil de esa persona.' }, { quoted: m });
                }
                if (targetData.married) {
                    const pareja2 = targetData.marriedTo ? `@${targetData.marriedTo.split('@')[0]}` : 'alguien más';
                    return sock.sendMessage(jid, { 
                        text: `「✿」 MATRIMONIO 🌸\n\n❌ @${target.split('@')[0]} ya está casado/a con ${pareja2}.`,
                        mentions: [target, ...(targetData.marriedTo ? [targetData.marriedTo] : [])]
                    }, { quoted: m });
                }

                // Si ya hay una propuesta pendiente para ese target, no spamear
                if (pending.has(target)) {
                    return sock.sendMessage(jid, { text: '「✿」 Ya hay una propuesta pendiente para esa persona, espera a que responda.' }, { quoted: m });
                }

                // Guardar propuesta 60 segundos
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

    // Para que aceptar/rechazar puedan usar la misma lista
    pending
};
