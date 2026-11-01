const db = require('../../database/db');
const activeSpawns = require('../../utils/gachaSpawns');

module.exports = {
    name: 'claim',
    aliases: ['c', 'reclamar'],
    category: 'gacha',
    description: 'Reclama el personaje que apareció en el chat.',

    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const sender = jid.endsWith('@g.us') ? (m.key.participant || jid) : jid;
        const context = m.message?.extendedTextMessage?.contextInfo;
        const spawned = activeSpawns.get(jid);

        if (!context?.quotedMessage) {
            return sock.sendMessage(jid, { text: '「✿」 Responde al mensaje del personaje con !claim para reclamarlo.' }, { quoted: m });
        }
        if (!spawned) {
            return sock.sendMessage(jid, { text: '「✿」 Ya no hay un personaje disponible. Usa !roll para invocar otro.' }, { quoted: m });
        }

        activeSpawns.delete(jid);
        db.getSafeUser(sender, (userErr, user) => {
            if (userErr) {
                activeSpawns.set(jid, spawned);
                console.error('Error al registrar usuario para reclamar personaje:', userErr.message);
                return sock.sendMessage(jid, { text: '「✿」 No pude preparar tu cuenta para el reclamo.' }, { quoted: m });
            }

            db.run(
                `INSERT INTO harem (owner_jid, character_name, series, image_url, value) VALUES (?, ?, ?, ?, ?)`,
                [sender, spawned.name, spawned.serie, spawned.image_url, Number(spawned.price) || 0],
                (err) => {
                    if (err) {
                        if (!activeSpawns.has(jid)) activeSpawns.set(jid, spawned);
                        console.error('Error al guardar personaje reclamado:', err.message);
                        return sock.sendMessage(jid, { text: '「✿」 No se pudo guardar el personaje en tu harem.' }, { quoted: m });
                    }
                    const template = user.claim_message || '「✿」 @user reclamó a *{character}* de _{series}_ 🌸';
                    const text = template
                        .replace(/@user/g, `@${sender.split('@')[0]}`)
                        .replace(/\{character\}/g, spawned.name)
                        .replace(/\{series\}/g, spawned.serie) +
                        (spawned.role ? `\n🎭 Rol: ${spawned.role}` : '');
                    sock.sendMessage(jid, {
                        text,
                        mentions: [sender]
                    }, { quoted: m });
                }
            );
        });
    }
};
