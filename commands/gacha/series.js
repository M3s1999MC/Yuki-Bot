const db = require('../../database/db');

module.exports = {
    name: 'serielist',
    aliases: ['slist', 'animelist', 'serie', 'series', 'catalogo', 'idlist', 'personajes'],
    category: 'gacha',
    description: 'Lista las series disponibles o los personajes con su ID.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const filter = args.join(' ').trim();
        if (filter) {
            return db.all(
                `SELECT id, name, serie FROM characters WHERE serie LIKE ? COLLATE NOCASE OR name LIKE ? COLLATE NOCASE ORDER BY serie COLLATE NOCASE, name COLLATE NOCASE LIMIT 50`,
                [`%${filter}%`, `%${filter}%`],
                (err, characters) => {
                    if (err) {
                        console.error('Error al consultar personajes del catálogo:', err.message);
                        return sock.sendMessage(jid, { text: '「✿」 No pude consultar el catálogo.' }, { quoted: m });
                    }
                    if (!characters.length) {
                        return sock.sendMessage(jid, { text: `「✿」 No encontré resultados para _${filter}_.` }, { quoted: m });
                    }
                    const text = `「✿」 Personajes del catálogo 🌸\n\n${characters.map(character =>
                        `#${character.id} · *${character.name}* — ${character.serie}`
                    ).join('\n')}`;
                    sock.sendMessage(jid, { text }, { quoted: m });
                }
            );
        }

        db.all(`SELECT serie, COUNT(*) AS total FROM characters GROUP BY serie ORDER BY serie COLLATE NOCASE`, [], (err, rows) => {
            if (err) {
                console.error('Error al consultar series del catálogo:', err.message);
                return sock.sendMessage(jid, { text: '「✿」 No pude consultar las series.' }, { quoted: m });
            }
            const text = rows.length
                ? `「✿」 Series disponibles 🌸\n\n${rows.map(row => `• ${row.serie} — ${row.total} personaje(s)`).join('\n')}\n\n_Usa !serie <nombre> para ver IDs._`
                : '「✿」 El catálogo todavía no tiene series registradas.';
            sock.sendMessage(jid, { text }, { quoted: m });
        });
    }
};
