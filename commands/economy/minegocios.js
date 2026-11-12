const economy = require('../../utils/economy');
const { listOwned, pendingIncome } = require('../../utils/businesses');
const { formatDuration } = require('../../utils/cooldowns');
const { reply, senderJid } = require('../../utils/commandHelpers');

module.exports = {
    name: 'minegocios',
    aliases: ['misnegocios', 'ngmis', 'miempresa'],
    category: 'economy',
    description: 'Ver el estado de tus negocios',

    async execute(sock, m, args, usedPrefix = '!') {
        try {
            const owned = await listOwned(senderJid(m, sock));
            if (!owned.length) return reply(sock, m, `「✿」 Todavía no tienes negocios. Mira la tienda con *${usedPrefix}negocios*.`);
            const now = Date.now();
            const lines = owned.map(({ business, row }) => {
                const left = Number(row.paid_until) - now;
                const state = left > 0 ? `mantenimiento: ${formatDuration(left)}` : '⚠️ sin mantenimiento (no produce)';
                return `${business.emoji} *${business.name}*\n   Por cobrar: ${economy.money(pendingIncome(business, row, now))} · ${state}`;
            });
            return reply(sock, m, `「✿」 🏪 *Tus negocios*\n\n${lines.join('\n\n')}`);
        } catch (error) {
            console.error('Error en !minegocios:', error.message);
            return reply(sock, m, '「✿」 No pude consultar tus negocios; inténtalo de nuevo en un momento.');
        }
    }
};
