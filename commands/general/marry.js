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

        // --- BUSCA AL ETIQUETADO EN TODOS LADOS ---
        // Porque a veces viene en extendedTextMessage, a veces en otro lado
        const msg = m.message || {};
        const ext = msg.extendedTextMessage || msg.conversation || {};
        const ctx = ext.contextInfo || msg.contextInfo || {};
        // También revisa si viene dentro de m.message directamente
        const ctx2 = m.message?.extendedTextMessage?.contextInfo || {};

        let target = ctx.mentionedJid?.[0] || ctx2.mentionedJid?.[0];

        console.log('MARRY DEBUG - mentioned:', ctx.mentionedJid, ctx2.mentionedJid, 'target:', target);

        if (!target || target === sender) {
            return await sock.sendMessage(jid, {
                text: '「✿」 PROPUESTA DE MATRIMONIO 🌸\n\nTienes que ETIQUETAR a la persona, no escribir el @ a mano.\nDeja apretado el @, selecciona a la persona de la lista para que salga azul, y luego pon:\n!marry @M'
            }, { quoted: m });
        }

        db.getSafeUser(sender, (err, senderData) => {
            if (err) return sock.sendMessage(jid, { text: 'Error con tu perfil.' }, { quoted: m });
            if (senderData.married) {
                return sock.sendMessage(jid, { text: 'Ya estás casado/a, usa !divorce primero.' }, { quoted: m });
            }

            db.getSafeUser(target, (err2, targetData) => {
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

                // --- FIX DEL TRIANGULITO: SIN MENTIONS, SOLO TEXTO PLANO ---
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
