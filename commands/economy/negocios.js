const economy = require('../../utils/economy');
const { BUSINESSES, listOwned } = require('../../utils/businesses');
const { reply, senderJid } = require('../../utils/commandHelpers');

module.exports = {
    name: 'negocios',
    aliases: ['shopnegocios', 'tiendanegocios'],
    category: 'economy',
    description: 'Ver la tienda de negocios disponibles para comprar',

    async execute(sock, m, args, usedPrefix = '!') {
        try {
            const owned = new Set((await listOwned(senderJid(m, sock))).map(item => item.business.id));
            const lines = BUSINESSES.map(item =>
                `${item.num}. ${item.emoji} *${item.name}*${owned.has(item.id) ? ' ✅ (tuyo)' : ''}\n   Precio: ${economy.money(item.price)} · Ganancia: ${economy.money(item.perHour)}/h · Mantenimiento: ${economy.money(item.upkeep)}/semana`
            );
            return reply(sock, m, `「✿」 🏪 *Tienda de negocios*\n\n${lines.join('\n\n')}\n\nCompra con *${usedPrefix}negocio <número>*. Cobra con *${usedPrefix}ngreclamar* (acumulan hasta 24 h) y paga el mantenimiento con *${usedPrefix}ngpagar*.`);
        } catch (error) {
            console.error('Error en !negocios:', error.message);
            return reply(sock, m, '「✿」 No pude mostrar la tienda; inténtalo de nuevo en un momento.');
        }
    }
};
