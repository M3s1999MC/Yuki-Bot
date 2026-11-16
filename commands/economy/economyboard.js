const economy = require('../../utils/economy');
const { reply } = require('../../utils/commandHelpers');

const PAGE_SIZE = 10;
const MEDALS = ['🥇', '🥈', '🥉'];

module.exports = {
    name: 'economyboard',
    aliases: ['eboard', 'baltop'],
    category: 'economy',
    description: 'Ranking de usuarios con más monedas: !economyboard [página]',

    async execute(sock, m, args) {
        try {
            const page = Math.max(1, parseInt((args || [])[0], 10) || 1);
            const offset = (page - 1) * PAGE_SIZE;
            const rows = await economy.all(
                'SELECT jid, name, (COALESCE(wallet, 0) + COALESCE(bank, 0)) AS total FROM users ORDER BY total DESC, jid ASC LIMIT ? OFFSET ?',
                [PAGE_SIZE, offset]
            );
            if (!rows.length) return reply(sock, m, page === 1 ? '「✿」 Todavía no hay registros en el ranking. 🌸' : `「✿」 No hay página ${page}.`);
            const mentions = [];
            const lines = rows.map((row, index) => {
                const position = offset + index;
                mentions.push(row.jid);
                return `${position < 3 ? MEDALS[position] : `${position + 1}.`} @${String(row.jid).split('@')[0]} — *${economy.money(row.total)}*`;
            });
            return reply(sock, m, `「✿」 🏆 *Ranking de economía* (página ${page})\n\n${lines.join('\n')}`, mentions);
        } catch (error) {
            console.error('Error en !economyboard:', error.message);
            return reply(sock, m, '「✿」 No pude consultar el ranking; inténtalo de nuevo en un momento.');
        }
    }
};
