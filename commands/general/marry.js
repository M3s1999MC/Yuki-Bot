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

        // Buscar al objetivo: etiquetado O respondido
        const msg = m.message || {};
        const ext = msg.extendedTextMessage || {};
        const ctx = ext.contextInfo || {};
        let target = ctx.mentionedJid?.[0] || ctx.participant;

        if (!target || target === sender) {
            return await sock.sendMessage(jid, { 
                text: '「✿」 PROPUESTA DE MATRIMONIO 🌸\n\nDebes mencionar a la persona con quien deseas casarte.\nEjemplo: !marry @M' 
            }, { quoted: m });
        }

        db.getSafeUser(sender, (err, senderData) => {
            if (err) return sock.sendMessage(jid, { text: 'Hubo un error con tu perfil.' }, { quoted: m });
            if (senderData.married) {
                return sock.sendMessage(jid, { 
                    text: `「✿」 MATRIMONIO 🌸\n\nYa estás casado/a, primero usa !divorce`,
                }, { quoted: m });
            }

            db.getSafeUser(target, (errTarget, targetData) => {
                if (errTarget) return sock.sendMessage(jid, { text: 'Hubo un error con el perfil de esa persona.' }, { quoted: m });
                if (targetData.married) {
                    return sock.sendMessage(jid, { text: `「✿」 Esa persona ya está casada.` }, { quoted: m });
                }

                if (pending.has(target)) {
                    return sock.sendMessage(jid, { text: 'Ya hay una propuesta pendiente para esa persona.' }, { quoted: m });
                }

                const timeout = setTimeout(() => {
                    pending.delete(target);
                    sock.sendMessage(jid, { text: `La propuesta expiró, nadie respondió. 💔` });
                }, 60000);
                pending.set(target, { sender, jid, timeout });

                // --- AQUÍ ESTÁ EL FIX DEL TRIANGULITO ---
                // Sin mentions raros, solo texto plano con el número
                // Así WhatsApp sí lo muestra aunque sea @lid
                const nombreSender = sender.split('@')[0];
                const nombreTarget = target.split('@')[0];

                sock.sendMessage(jid, {
                    text: `「✿」 ¡PROPUESTA ENVIADA! 🌸\n\n💍 ${nombreSender} le ha propuesto matrimonio a ${nombreTarget}! 💕\n\n${nombreTarget}, responde !aceptar para aceptar o !rechazar para rechazar. Tienes 60 segundos.`
                }, { quoted: m });
            });
        });
    },
    pending
};
