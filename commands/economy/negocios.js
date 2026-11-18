const economy = require('../../utils/economy');
const { BUSINESSES, listOwned } = require('../../utils/businesses');
const { reply, senderJid } = require('../../utils/commandHelpers');

module.exports = {
    name: 'negocios',
    aliases: ['shopnegocios', 'tiendanegocios'],
    category: 'economy',
    description: 'Ver la tienda de establecimientos comerciales disponibles para comprar con Bolívares.',

    async execute(sock, m, args, usedPrefix = '!') {
        try {
            const sender = senderJid(m, sock);
            const ownedItems = await listOwned(sender);
            const owned = new Set(ownedItems.map(item => item.business.id));

            const lines = BUSINESSES.map(item => {
                const isOwned = owned.has(item.id);
                const statusTag = isOwned ? ' ✅ *(Adquirido)*' : '';
                const priceFormatted = item.price.toLocaleString('es-CO');
                const perHourFormatted = item.perHour.toLocaleString('es-CO');
                const upkeepFormatted = item.upkeep.toLocaleString('es-CO');

                return `❀ ${item.num}. ${item.emoji} *${item.name}*${statusTag}\n` +
                       `   ↳ Precio: \`$${priceFormatted} Bolívares\`\n` +
                       `   ↳ Ganancia: \`$${perHourFormatted}/h\`\n` +
                       `   ↳ Mantenimiento: \`$${upkeepFormatted}/semana\``;
            });

            const text = `「✿」 TIENDA DE NEGOCIOS 🏪✨\n\n` +
                         `₊˚ˑ༄ Establecimientos comerciales disponibles en la red:\n\n` +
                         lines.join('\n\n') + `\n\n` +
                         `───────────────────\n` +
                         `❀ Compra con: \`${usedPrefix}negocio <número>\`\n` +
                         `❀ Cobra ganancias con: \`${usedPrefix}ngreclamar\` *(acumulan hasta 24h)*\n` +
                         `❀ Paga mantenimiento con: \`${usedPrefix}ngpagar\` 🌸`;

            return reply(sock, m, text, [sender]);

        } catch (error) {
            console.error('Error en !negocios:', error.message);
            return reply(sock, m, '「✿」 ERROR DE RED // No pude mostrar la tienda de negocios; inténtalo de nuevo en un momento. 🥀');
        }
    }
};
