const economy = require('../../utils/economy');
const { reply } = require('../../utils/commandHelpers');

const PAGE_SIZE = 10;
const MEDALS = ['🥇', '🥈', '🥉'];

module.exports = {
    name: 'economyboard',
    aliases: ['eboard', 'baltop'],
    category: 'economy',
    description: 'Ranking de usuarios con más Bolívares en la red: !economyboard [página]',

    async execute(sock, m, args) {
        try {
            const page = Math.max(1, parseInt((args || [])[0], 10) || 1);
            const offset = (page - 1) * PAGE_SIZE;
            
            const rows = await economy.all(
                'SELECT jid, name, (COALESCE(wallet, 0) + COALESCE(bank, 0)) AS total FROM users ORDER BY total DESC, jid ASC LIMIT ? OFFSET ?',
                [PAGE_SIZE, offset]
            );

            if (!rows.length) {
                return reply(sock, m, page === 1 
                    ? '「✿」 RANKING VACÍO // Todavía no hay registros financieros en el sistema. 🌸' 
                    : `「✿」 PÁGINA INEXISTENTE // No hay registros en la página ${page}. 🥀`
                );
            }

            const mentions = [];
            const lines = rows.map((row, index) => {
                const position = offset + index;
                mentions.push(row.jid);
                const prefix = position < 3 ? MEDALS[position] : `${position + 1}.`;
                const saldoFormateado = typeof row.total === 'number' ? row.total.toLocaleString('es-CO') : row.total;
                
                return `${prefix} @${String(row.jid).split('@')[0]} — \`$${saldoFormateado} Bolívares\``;
            });

            const text = `「✿」 RANKING DE ECONOMÍA // Página ${page} 🏆✨\n\n` +
                         lines.join('\n') + `\n\n` +
                         `───────────────────\n` +
                         `❀ _¡Los magnates más ricos de la red de Yuki!_ 🌸`;

            return reply(sock, m, text, mentions);

        } catch (error) {
            console.error('Error en !economyboard:', error.message);
            return reply(sock, m, '「✿」 ERROR DE RED // No pude consultar el ranking; inténtalo de nuevo en un momento. 🥀');
        }
    }
};
