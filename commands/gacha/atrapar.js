const db = require('../../database/db');

module.exports = {
    name: 'atrapar',
    aliases: ['catch', 'usarticket'],
    category: 'gacha',
    description: 'Usa un ticket para atrapar un personaje libre por su ID.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = jid.endsWith('@g.us') ? (m.key.participant || jid) : jid;
        const id = Number.parseInt(args[0], 10);
        if (!Number.isInteger(id) || id < 1) {
            return sock.sendMessage(jid, { text: '「✿」 Indica el ID de un personaje libre. Consulta !serie para ver el catálogo.' }, { quoted: m });
        }

        db.getSafeUser(sender, (userErr, user) => {
            if (userErr) {
                console.error('Error al registrar usuario para usar ticket:', userErr.message);
                return sock.sendMessage(jid, { text: '「✿」 No pude preparar tu cuenta.' }, { quoted: m });
            }
            if ((user.tickets || 0) < 1) {
                return sock.sendMessage(jid, { text: '「✿」 No tienes tickets de captura disponibles. 🎟️' }, { quoted: m });
            }

            db.get(
                `SELECT c.id, c.name, c.serie, c.price, c.image_url
                 FROM characters c
                 WHERE c.id = ? AND NOT EXISTS (
                    SELECT 1 FROM harem h WHERE h.character_name = c.name
                 )`,
                [id],
                (findErr, character) => {
                    if (findErr || !character) {
                        if (findErr) console.error('Error al buscar personaje libre:', findErr.message);
                        return sock.sendMessage(jid, { text: '「✿」 Ese ID no existe o el personaje ya fue reclamado.' }, { quoted: m });
                    }

                    db.run(`UPDATE users SET tickets = tickets - 1 WHERE jid = ? AND tickets > 0`, [sender], function(ticketErr) {
                        if (ticketErr) {
                            console.error('Error al descontar ticket:', ticketErr.message);
                            return sock.sendMessage(jid, { text: '「✿」 No se pudo usar el ticket.' }, { quoted: m });
                        }
                        if (!this.changes) {
                            return sock.sendMessage(jid, { text: '「✿」 Ya no tienes tickets disponibles.' }, { quoted: m });
                        }

                        db.run(
                            `INSERT INTO harem (owner_jid, character_name, series, image_url, value) VALUES (?, ?, ?, ?, ?)`,
                            [sender, character.name, character.serie, character.image_url, Number(character.price) || 0],
                            (insertErr) => {
                                if (insertErr) {
                                    console.error('Error al guardar personaje atrapado:', insertErr.message);
                                    db.run(`UPDATE users SET tickets = tickets + 1 WHERE jid = ?`, [sender], (refundErr) => {
                                        if (refundErr) console.error('Error al devolver ticket:', refundErr.message);
                                    });
                                    return sock.sendMessage(jid, { text: '「✿」 No se pudo guardar el personaje; se intentó devolver el ticket.' }, { quoted: m });
                                }
                                sock.sendMessage(jid, { text: `「✿」 Usaste 1 ticket y atrapaste a *${character.name}* de _${character.serie}_. 🎟️🌸` }, { quoted: m });
                            }
                        );
                    });
                }
            );
        });
    }
};
