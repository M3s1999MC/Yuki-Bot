const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

// Ahora guardamos por GRUPO, no por JID, para que no falle por el @lid
const pending = new Map(); // key: groupJid -> { sender, target, timeout }
// Para compatibilidad, también guardamos por target
const pendingByTarget = new Map();

function isMarried(val) {
    return val && val !== 'Nadie 💔' && val !== 'Nadie' && val !== '' && val !== 'null' && val !== null;
}

function clearPending(groupJid, target) {
    const p = pending.get(groupJid);
    if (p) {
        clearTimeout(p.timeout);
        pending.delete(groupJid);
    }
    if (target) pendingByTarget.delete(target);
    // Limpia cualquier entrada que tenga ese target
    for (const [k, v] of pendingByTarget.entries()) {
        if (v.target === target || v.sender === target) pendingByTarget.delete(k);
    }
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
        if (!target && ctx.participant) target = ctx.participant;
        // También soporta si citan el mensaje
        if (!target && ctx.quotedMessage && ctx.participant) target = ctx.participant;

        if (!target) {
            return sock.sendMessage(jid, { text: `「✿」 ¡Oye, cielito! 🌸\n\nTienes que etiquetar a tu amorcito, no escribas el @ a mano.\nEjemplo: !marry @alguien` }, { quoted: m });
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
                    return sock.sendMessage(jid, { text: `「✿」 No pude ver el perfil de esa personita 🥺` }, { quoted: m });
                }
                if (isMarried(targetData.married)) {
                    return sock.sendMessage(jid, { text: `「✿」 Esa personita ya está casada, cielito 💔 Busca otro amorcito 🌸` }, { quoted: m });
                }
                if (pending.has(jid)) {
                    return sock.sendMessage(jid, { text: `「✿」 Ya hay una propuesta pendiente en este grupo, espera que responda 🥺` }, { quoted: m });
                }

                const timeout = setTimeout(() => {
                    pending.delete(jid);
                    pendingByTarget.delete(target);
                    sock.sendMessage(jid, { text: `「✿」 La propuesta expiró... Nadie respondió 💔🌸` });
                }, 60000);

                const propuesta = { sender, target, jid, timeout };
                pending.set(jid, propuesta);
                pendingByTarget.set(target, propuesta);
                // Guardamos también con el sender para buscar por cualquier lado
                pendingByTarget.set(sender, propuesta);

                await sock.sendMessage(jid, {
                    text: `「✿」 ¡OMG! 💍🌸\n\n¡@${sender.split('@')[0]} le está pidiendo matrimonio a @${target.split('@')[0]}! (⁠≧⁠▽⁠≦⁠)💕\n\n@${target.split('@')[0]}, cielito, ¿te casas con @${sender.split('@')[0]}? 🥺\nResponde !aceptar si dices que sí o !rechazar si lo vas a dejar llorando... ¡Tienes 60 segundos! ⏳💔`,
                    mentions: [sender, target]
                }, { quoted: m });
            });
        });
    },
    pending,
    pendingByTarget,
    clearPending
};