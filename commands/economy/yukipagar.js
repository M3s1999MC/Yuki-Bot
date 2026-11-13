const economy = require('../../utils/economy');
const { listOwned, findBusiness, payUpkeep } = require('../../utils/businesses');
const { reply, senderJid } = require('../../utils/commandHelpers');

module.exports = {
    name: 'yukipagar',
    aliases: ['pagarnegocios', 'pagarmantenimiento', 'ygp'],
    category: 'economy',
    description: 'Pagar el mantenimiento semanal de tus negocios',

    async execute(sock, m, args, usedPrefix = '!') {
        try {
            const jid = senderJid(m, sock);
            const query = args[0]?.toLowerCase();
            const ownedList = await listOwned(jid);

            if (ownedList.length === 0) {
                return reply(sock, m, `「✿」 No tienes negocios. Mira la tienda con *${usedPrefix}negocios*.`);
            }

            // Si pasa un argumento específico (ej: !yukipagar arepas o !yukipagar 1)
            if (query && !['todo', 'all'].includes(query)) {
                const business = findBusiness(query);
                if (!business) {
                    return reply(sock, m, `「✿」 No encontré ese negocio. Usa el número o nombre correcto.`);
                }

                const result = await payUpkeep(jid, business);
                if (!result.ok) {
                    if (result.reason === 'not-owned') return reply(sock, m, `「✿」 No eres dueño de ese negocio.`);
                    if (result.reason === 'too-early') return reply(sock, m, `「✿」 Tus pagos de mantenimiento están muy adelantados.`);
                    if (result.reason === 'funds') return reply(sock, m, `「✿」 No tienes suficiente dinero para pagar el mantenimiento de ${business.name} (*${economy.money(business.upkeep)}*).`);
                    return reply(sock, m, `「✿」 No pude procesar el pago en este momento.`);
                }

                const recMsg = result.recovered > 0 ? `\n¡Ganancias recuperadas: +${economy.money(result.recovered)}!` : '';
                return reply(sock, m, `「✿」 🧾 Mantenimiento pagado para ${business.emoji} *${business.name}* (-${economy.money(result.cost)}).${recMsg} 🌸`);
            }

            // Si no especifica o pone "todo", intentamos pagar el mantenimiento de todos los negocios que posea
            let totalCost = 0;
            const details = [];
            let failed = false;

            for (const { business } of ownedList) {
                const result = await payUpkeep(jid, business);
                if (result.ok) {
                    totalCost += result.cost;
                    details.push(`${business.emoji} ${business.name}: -${economy.money(result.cost)}`);
                } else if (result.reason === 'funds') {
                    details.push(`${business.emoji} ${business.name}: ❌ Fondos insuficientes`);
                    failed = true;
                }
            }

            if (totalCost === 0 && failed) {
                return reply(sock, m, `「✿」 No tienes suficiente dinero para pagar el mantenimiento de tus negocios.`);
            }

            if (details.length === 0) {
                return reply(sock, m, `「✿」 Tus negocios ya están al día con sus pagos 🌸`);
            }

            return reply(sock, m, `「✿」 🧾 *Mantenimiento procesado*\n\n${details.join('\n')}\n\n*Total pagado: -${economy.money(totalCost)}* 🌸`);

        } catch (error) {
            console.error('Error en !yukipagar:', error.message);
            return reply(sock, m, '「✿」 No pude procesar el pago de mantenimiento; inténtalo de nuevo en un momento.');
        }
    }
};
