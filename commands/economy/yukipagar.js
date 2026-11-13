const economy = require('../../utils/economy');
const { payMaintenance, payAllMaintenance } = require('../../utils/businesses');
const { reply, senderJid } = require('../../utils/commandHelpers');

module.exports = {
    name: 'yukipagar',
    aliases: ['pagarnegocios', 'pagarmantenimiento', 'ygp'],
    category: 'economy',
    description: 'Pagar el mantenimiento acumulado de tus negocios',

    async execute(sock, m, args, usedPrefix = '!') {
        try {
            const jid = senderJid(m, sock);
            const target = args[0]?.toLowerCase();

            // Si no pasa argumentos o escribe "todo"/"all", paga todos los negocios pendientes
            const result = (!target || ['todo', 'all'].includes(target))
                ? await payAllMaintenance(jid)
                : await payMaintenance(jid, target);

            if (!result.owned) {
                return reply(sock, m, `「✿」 No tienes negocios. Mira la tienda con *${usedPrefix}negocios*.`);
            }

            if (result.total <= 0) {
                return reply(sock, m, `「✿」 Tus negocios están al día; no tienes mantenimiento pendiente por pagar 🌸`);
            }

            if (result.insufficient) {
                return reply(sock, m, `「✿」 No tienes suficiente dinero. Necesitas *${economy.money(result.total)}* para cubrir el mantenimiento.`);
            }

            const detail = result.details
                .map(item => `${item.business.emoji} ${item.business.name}: -${economy.money(item.amount)}`)
                .join('\n');

            return reply(sock, m, `「✿」 🧾 *Mantenimiento pagado*\n\n${detail}\n\n*Total pagado: -${economy.money(result.total)}* 🌸`);
        } catch (error) {
            console.error('Error en !yukipagar:', error.message);
            return reply(sock, m, '「✿」 No pude procesar el pago de mantenimiento; inténtalo de nuevo en un momento.');
        }
    }
};
