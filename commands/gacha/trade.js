const db = require('../../database/db');

module.exports = {
    name: 'trade',
    aliases: ['intercambiar'],
    category: 'gacha',
    description: 'Intercambia un personaje con otro usuario.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = jid.endsWith('@g.us') ? (m.key.participant || jid) : jid;
        const context = m.message?.extendedTextMessage?.contextInfo;
        const target = context?.mentionedJid?.[0] || context?.participant;
        const [ownName, targetName] = args.join(' ').split('|').map(value => value.trim());

        if (!target || target === sender) {
            return sock.sendMessage(jid, { text: '「✿」 Menciona a otra persona para intercambiar personajes.' }, { quoted: m });
        }
        if (!ownName || !targetName) {
            return sock.sendMessage(jid, { text: '「✿」 Usa !trade @usuario tu personaje | su personaje.' }, { quoted: m });
        }

        db.getSafeUser(target, (ensureErr) => {
            if (ensureErr) {
                console.error('Error al registrar destinatario del intercambio:', ensureErr.message);
                return sock.sendMessage(jid, { text: '「✿」 No pude preparar la cuenta del otro usuario.' }, { quoted: m });
            }
            const fail = (message, error) => {
                db.run('ROLLBACK', (rollbackErr) => {
                    if (rollbackErr) console.error('Error al revertir intercambio:', rollbackErr.message);
                    if (error) console.error('Error en intercambio gacha:', error.message);
                    sock.sendMessage(jid, { text: message }, { quoted: m });
                });
            };

            db.run('BEGIN IMMEDIATE', (beginErr) => {
                if (beginErr) {
                    console.error('No se pudo iniciar intercambio gacha:', beginErr.message);
                    return sock.sendMessage(jid, { text: '「✿」 No se pudo iniciar el intercambio.' }, { quoted: m });
                }
                db.get(`SELECT id, character_name FROM harem WHERE owner_jid = ? AND character_name LIKE ? COLLATE NOCASE LIMIT 1`, [sender, `%${ownName}%`], (ownErr, ownCharacter) => {
                    if (ownErr || !ownCharacter) return fail('「✿」 No encontré tu personaje en el harem.', ownErr);
                    db.get(`SELECT id, character_name FROM harem WHERE owner_jid = ? AND character_name LIKE ? COLLATE NOCASE LIMIT 1`, [target, `%${targetName}%`], (targetErr, targetCharacter) => {
                        if (targetErr || !targetCharacter) return fail('「✿」 No encontré el personaje de la otra persona.', targetErr);

                        db.run(`UPDATE harem SET owner_jid = ? WHERE id = ?`, [target, ownCharacter.id], (firstErr) => {
                            if (firstErr) return fail('「✿」 No se pudo completar el intercambio.', firstErr);
                            db.run(`UPDATE harem SET owner_jid = ? WHERE id = ?`, [sender, targetCharacter.id], (secondErr) => {
                                if (secondErr) return fail('「✿」 No se pudo completar el intercambio.', secondErr);
                                db.run('COMMIT', (commitErr) => {
                                    if (commitErr) return fail('「✿」 No se pudo confirmar el intercambio.', commitErr);
                                    sock.sendMessage(jid, {
                                        text: `「✿」 Intercambio completado 🌸\n@${sender.split('@')[0]} recibió *${targetCharacter.character_name}* y @${target.split('@')[0]} recibió *${ownCharacter.character_name}*.`,
                                        mentions: [sender, target]
                                    }, { quoted: m });
                                });
                            });
                        });
                    });
                });
            });
        });
    }
};
