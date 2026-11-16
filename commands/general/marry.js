const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');
const { neon } = require('@neondatabase/serverless');

// Usa la variable DATABASE_URL de Render, la misma de tu db.js
const sql = neon(process.env.DATABASE_URL);

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
        if (!target && ctx.participant) target = ctx.participant;

        if (!target) {
            return sock.sendMessage(jid, { text: `「✿」 ¡Oye, cielito! 🌸\n\nTienes que etiquetar a tu amorcito, no escribas el @ a mano.\nEjemplo: !marry @alguien` }, { quoted: m });
        }
        if (target === sender) {
            return sock.sendMessage(jid, { text: `「✿」 Cielito, no te puedes casar contigo mismo/a 🥺🌸` }, { quoted: m });
        }

        // Crea la tabla en Neon si no existe, usando tu DATABASE_URL
        await sql`CREATE TABLE IF NOT EXISTS marry_pending (
            group_jid TEXT PRIMARY KEY,
            sender TEXT NOT NULL,
            target TEXT NOT NULL,
            created_at BIGINT NOT NULL
        )`;
        await sql`DELETE FROM marry_pending WHERE created_at < ${Date.now() - 5 * 60 * 1000}`;

        const existing = await sql`SELECT * FROM marry_pending WHERE group_jid = ${jid}`;
        if (existing.length > 0) {
            return sock.sendMessage(jid, { text: `「✿」 Ya hay una propuesta pendiente en este grupo, espera que responda 🥺` }, { quoted: m });
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

                // Noah propone -> se guarda en Neon con tu DATABASE_URL
                await sql`INSERT INTO marry_pending (group_jid, sender, target, created_at) VALUES (${jid}, ${sender}, ${target}, ${Date.now()}) ON CONFLICT (group_jid) DO UPDATE SET sender = ${sender}, target = ${target}, created_at = ${Date.now()}`;
                console.log(`[MARRY-NEON] Guardado: ${sender} -> ${target} en ${jid} | DATABASE_URL existe? ${!!process.env.DATABASE_URL}`);

                await sock.sendMessage(jid, {
                    text: `「✿」 ¡OMG! 💍🌸\n\n¡@${sender.split('@')[0]} le está pidiendo matrimonio a @${target.split('@')[0]}! (⁠≧⁠▽⁠≦⁠)💕\n\n@${target.split('@')[0]}, cielito, ¿te casas con @${sender.split('@')[0]}? 🥺\nResponde !aceptar si dices que sí o !rechazar si lo vas a dejar llorando... ¡Tienes 5 minutos! ⏳💔`,
                    mentions: [sender, target]
                }, { quoted: m });
            });
        });
    }
};