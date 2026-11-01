const db = require('../../database/db');

module.exports = {
    name: 'principal',
    aliases: ['setmain', 'waifuprincipal', 'setfav', 'setfavourite', 'deletefav', 'delfav'],
    category: 'gacha',
    description: 'Marca o elimina tu personaje principal.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = jid.endsWith('@g.us') ? (m.key.participant || jid) : jid;
        const body = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const command = body.replace(/^!/, '').trim().split(/\s+/)[0].toLowerCase();
        const remove = ['deletefav', 'delfav'].includes(command);
        const query = args.join(' ').trim();

        if (!remove && !query) {
            return sock.sendMessage(jid, { text: '「✿」 Indica el nombre del personaje de tu harem que quieres destacar.' }, { quoted: m });
        }
        db.getSafeUser(sender, (ensureErr) => {
            if (ensureErr) {
                console.error('Error al registrar usuario para personaje principal:', ensureErr.message);
                return sock.sendMessage(jid, { text: '「✿」 No pude preparar tu perfil.' }, { quoted: m });
            }
            if (remove) {
                return db.run(`UPDATE users SET main_waifu = NULL WHERE jid = ?`, [sender], (err) => {
                    if (err) {
                        console.error('Error al eliminar personaje principal:', err.message);
                        return sock.sendMessage(jid, { text: '「✿」 No se pudo eliminar tu personaje principal.' }, { quoted: m });
                    }
                    sock.sendMessage(jid, { text: '「✿」 Se quitó tu personaje principal. 🌸' }, { quoted: m });
                });
            }

            db.get(
                `SELECT character_name FROM harem WHERE owner_jid = ? AND character_name LIKE ? COLLATE NOCASE LIMIT 1`,
                [sender, `%${query}%`],
                (err, character) => {
                    if (err || !character) {
                        if (err) console.error('Error al buscar personaje principal:', err.message);
                        return sock.sendMessage(jid, { text: '「✿」 No encontré ese personaje en tu harem.' }, { quoted: m });
                    }
                    db.run(`UPDATE users SET main_waifu = ? WHERE jid = ?`, [character.character_name, sender], (updateErr) => {
                        if (updateErr) {
                            console.error('Error al guardar personaje principal:', updateErr.message);
                            return sock.sendMessage(jid, { text: '「✿」 No se pudo guardar tu personaje principal.' }, { quoted: m });
                        }
                        sock.sendMessage(jid, { text: `「✿」 *${character.character_name}* ahora es tu personaje principal. ⭐` }, { quoted: m });
                    });
                }
            );
        });
    }
};
