const economy = require('../../utils/economy');
const { listOwned, findBusiness, payUpkeep } = require('../../utils/businesses');
const { reply, senderJid } = require('../../utils/commandHelpers');

const REASONS = {
    funds: 'no te alcanza el dinero de la billetera',
    'too-early': 'ya lo tienes pagado por 3 semanas o más (el máximo es 4)',
    busy: 'hubo un cambio al mismo tiempo, intenta de nuevo',
    'not-owned': 'no tienes ese negocio'
};

module.exports = {
    name: 'ngpagar',
    aliases: ['pagarnegocios', 'ngmantenimiento'],
    category: 'economy',
    description: 'Pagar el mantenimiento semanal de tus negocios: !ngpagar [número|todos]',

    async execute(sock, m, args, usedPrefix = '!') {
        try {
            const jid = senderJid(m, sock);
            const owned = await listOwned(jid);
            if (!owned.length) return reply(sock, m, `「✿」 No tienes negocios. Mira la tienda con *${usedPrefix}negocios*.`);

            const query = (args || []).join(' ').trim().toLowerCase();
            let targets = owned.map(item => item.business);
            if (query && query !== 'todos' && query !== 'todo') {
                const chosen = findBusiness(query);
                targets = chosen ? targets.filter(item => item.id === chosen.id) : [];
                if (!targets.length) return reply(sock, m, `「✿」 No tienes ese negocio. Usa *${usedPrefix}ngpagar* sin nada para pagarlos todos.`);
            }

            const lines = [];
            let spent = 0;
            for (const business of targets) {
                const result = await payUpkeep(jid, business);
                if (result.ok) {
                    spent += result.cost;
                    const extra = result.recovered > 0 ? ` (+${economy.money(result.recovered)} de ganancias pendientes)` : '';
                    lines.push(`✅ ${business.emoji} ${business.name}: ${economy.money(result.cost)}${extra}`);
                } else {
                    lines.push(`➖ ${business.emoji} ${business.name}: ${REASONS[result.reason] || 'no se pudo'}`);
                }
            }
            const footer = spent > 0 ? `\n\nGastaste ${economy.money(spent)}. Cada pago suma 7 días.` : '';
            return reply(sock, m, `「✿」 🔧 *Mantenimiento*\n\n${lines.join('\n')}${footer}`);
        } catch (error) {
            console.error('Error en !ngpagar:', error.message);
            return reply(sock, m, '「✿」 No pude pagar el mantenimiento; inténtalo de nuevo en un momento.');
        }
    }
};
