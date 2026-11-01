const db = require('../../database/db');

module.exports = {
    name: 'waifusboard',
    aliases: ['waifustop', 'topwaifus', 'wtop', 'favboard', 'favtop', 'favoritetop'],
    category: 'gacha',
    description: 'Muestra los personajes más valiosos o favoritos.',

    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const body = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const command = body.replace(/^!/, '').trim().split(/\s+/)[0].toLowerCase();
        const favorites = ['favboard', 'favtop', 'favoritetop'].includes(command);
        const sql = favorites
            ? `SELECT main_waifu AS character_name, COUNT(*) AS score
               FROM users WHERE main_waifu IS NOT NULL AND main_waifu != ''
               GROUP BY main_waifu ORDER BY score DESC, character_name COLLATE NOCASE LIMIT 10`
            : `SELECT character_name, SUM(value) AS score
               FROM harem GROUP BY character_name ORDER BY score DESC, character_name COLLATE NOCASE LIMIT 10`;

        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error('Error al consultar tablero gacha:', err.message);
                return sock.sendMessage(jid, { text: '「✿」 No pude consultar el top de personajes.' }, { quoted: m });
            }
            const title = favorites ? 'Personajes favoritos' : 'Personajes más valiosos';
            const text = rows.length
                ? `「✿」 ${title} 🌸\n\n${rows.map((row, i) =>
                    `${i + 1}. *${row.character_name}* — ${Number(row.score || 0).toLocaleString('es-CO')}${favorites ? ' voto(s)' : ' 💎'}`
                ).join('\n')}`
                : `「✿」 Todavía no hay registros para *${title.toLowerCase()}*.`;
            sock.sendMessage(jid, { text }, { quoted: m });
        });
    }
};
