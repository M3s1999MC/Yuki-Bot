const economy = require('../../utils/economy');
const { findBusiness, buy } = require('../../utils/businesses');
const { reply, senderJid, mentionTag } = require('../../utils/commandHelpers');

module.exports = {
    name: 'negocio',
    aliases: ['ngyukicomprar', 'compraryukisnegocio', 'ngcomprar', 'comprarnegocio'],
    category: 'economy',
    description: 'Adquiere un establecimiento comercial del catálogo utilizando tus fondos en Bolívares.',

    async execute(sock, m, args, usedPrefix = '!') {
        const sender = senderJid(m, sock);
        const query = (args || []).join(' ');
        const business = findBusiness(query);

        if (!business) {
            return reply(sock, m, 
                `「✿」 CATÁLOGO DE NEGOCIOS 🏪✨\n\n` +
                `₊˚ˑ༄ Indica qué establecimiento deseas comprar ingresando su número o nombre.\n` +
                `❀ *Uso:* \`${usedPrefix}negocio <número>\`\n` +
                `❀ Consulta la lista disponible con: \`${usedPrefix}negocios\` 🌸`
            );
        }

        try {
            const result = await buy(sender, business);
            const priceFormatted = business.price.toLocaleString('es-CO');
            const perHourFormatted = business.perHour.toLocaleString('es-CO');

            if (!result.ok && result.reason === 'owned') {
                return reply(sock, m, 
                    `「✿」 NEGOCIO YA ADQUIRIDO 🥀\n\n` +
                    `₊˚ˑ༄ Ya eres propietario de este establecimiento comercial en la red.\n` +
                    `❀ *Negocio:* ${business.emoji} *${business.name}* 🌸`
                );
            }

            if (!result.ok) {
                return reply(sock, m, 
                    `「✿」 FONDOS INSUFICIENTES 🥀\n\n` +
                    `₊˚ˑ༄ No tienes suficientes Bolívares en tu billetera para esta inversión.\n` +
                    `❀ *Precio:* \`$${priceFormatted} Bolívares\`\n` +
                    `❀ _Nota: El pago debe realizarse directamente desde la billetera (no del banco)._ 📉`
                );
            }

            const text = `「✿」 EMPRESA ADQUIRIDA CON ÉXITO 🏪✨\n\n` +
                         `₊˚ˑ༄ ¡Has comprado un nuevo establecimiento comercial!\n` +
                         `❀ ${business.emoji} *Negocio:* \`${business.name}\`\n` +
                         `❀ 💰 *Inversión:* \`$${priceFormatted} Bolívares\`\n` +
                         `❀ 📈 *Producción:* \`$${perHourFormatted} Bolívares/h\`\n` +
                         `❀ 🗓️ *Mantenimiento:* ¡Primera semana pagada!\n` +
                         `───────────────────\n` +
                         `❀ _Recoge tus ganancias usando:_ \`${usedPrefix}ngreclamar\` 🌸`;

            return reply(sock, m, text, [sender]);

        } catch (error) {
            console.error('Error en !negocio:', error.message);
            return reply(sock, m, '「✿」 ERROR DE RED // No pude completar la compra del negocio; inténtalo de nuevo en un momento. 🥀');
        }
    }
};
