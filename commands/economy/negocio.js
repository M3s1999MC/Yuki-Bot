const economy = require('../../utils/economy');
const { findBusiness, buy } = require('../../utils/businesses');
const { reply, senderJid } = require('../../utils/commandHelpers');

module.exports = {
    name: 'negocio',
    aliases: ['ngcomprar', 'comprarnegocio'],
    category: 'economy',
    description: 'Comprar un negocio de la tienda: !negocio <número>',

    async execute(sock, m, args, usedPrefix = '!') {
        const business = findBusiness((args || []).join(' '));
        if (!business) {
            return reply(sock, m, `「✿」 Indica qué negocio quieres comprar: *${usedPrefix}negocio <número>*. Mira la lista con *${usedPrefix}negocios*.`);
        }
        try {
            const result = await buy(senderJid(m, sock), business);
            if (!result.ok && result.reason === 'owned') return reply(sock, m, `「✿」 Ya tienes ${business.emoji} *${business.name}*.`);
            if (!result.ok) return reply(sock, m, `「✿」 No te alcanza: ${business.emoji} *${business.name}* cuesta ${economy.money(business.price)} y debe estar en tu billetera (no en el banco).`);
            return reply(sock, m, `「✿」 ${business.emoji} ¡Compraste *${business.name}* por ${economy.money(business.price)}!\nGenera ${economy.money(business.perHour)}/h. Tienes la primera semana de mantenimiento pagada.\nCobra con *${usedPrefix}ngreclamar*.`);
        } catch (error) {
            console.error('Error en !negocio:', error.message);
            return reply(sock, m, '「✿」 No pude completar la compra; inténtalo de nuevo en un momento.');
        }
    }
};
