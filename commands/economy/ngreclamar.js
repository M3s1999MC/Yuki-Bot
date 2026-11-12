const economy = require('../../utils/economy');
const { collectAll } = require('../../utils/businesses');
const missions = require('../../utils/missions');
const { reply, senderJid } = require('../../utils/commandHelpers');

module.exports = {
    name: 'ngreclamar',
    aliases: ['ngcobrar', 'ngclaim', 'reclamarnegocios', 'cobrarnegocios'],
    category: 'economy',
    description: 'Cobrar el dinero acumulado de tus negocios',

    async execute(sock, m, args, usedPrefix = '!') {
        try {
            const jid = senderJid(m, sock);
            const result = await collectAll(jid);
            if (!result.owned) return reply(sock, m, `「✿」 No tienes negocios. Mira la tienda con *${usedPrefix}negocios*.`);
            if (result.total <= 0) return reply(sock, m, `「✿」 Aún no hay ganancias por cobrar. Si un negocio no produce, revisa su mantenimiento con *${usedPrefix}minegocios*.`);
            await missions.track(jid, 'negocio');
            const detail = result.details.map(item => `${item.business.emoji} ${item.business.name}: ${economy.money(item.amount)}`).join('\n');
            return reply(sock, m, `「✿」 💰 *Ganancias cobradas*\n\n${detail}\n\n*Total: +${economy.money(result.total)}* 🌸`);
        } catch (error) {
            console.error('Error en !ngreclamar:', error.message);
            return reply(sock, m, '「✿」 No pude cobrar; inténtalo de nuevo en un momento.');
        }
    }
};
