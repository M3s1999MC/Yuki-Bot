const economy = require('../../utils/economy');
const { listOwned, pendingIncome } = require('../../utils/businesses');
const { formatDuration } = require('../../utils/cooldowns');
const { reply, senderJid } = require('../../utils/commandHelpers');

module.exports = {
    name: 'minegocios',
    aliases: ['misnegocios', 'yukingmis', 'ngmis', 'miempresa'],
    category: 'economy',
    description: 'Ver el estado de tus negocios y ganancias acumuladas en Bolívares',

    async execute(sock, m, args, usedPrefix = '!') {
        try {
            const sender = senderJid(m, sock);
            const owned = await listOwned(sender);

            if (!owned.length) {
                return reply(sock, m, 
                    `「✿」 SIN EMPRESAS REGISTRADAS 🥀\n\n` +
                    `₊˚ˑ༄ Todavía no posees ningún negocio comercial en la red.\n` +
                    `❀ Explora el catálogo de la tienda con: \`${usedPrefix}negocios\` 🌸`
                );
            }

            const now = Date.now();
            const lines = owned.map(({ business, row }) => {
                const left = Number(row.paid_until) - now;
                const pendiente = pendingIncome(business, row, now);
                const pendienteFormateado = pendiente.toLocaleString('es-CO');
                
                const state = left > 0 
                    ? `Mantenimiento activo: *${formatDuration(left)}*` 
                    : `⚠️ *Sin mantenimiento* (no produce ingresos)`;

                return `❀ ${business.emoji} *${business.name}*\n` +
                       `   ↳ Por cobrar: \`$${pendienteFormateado} Bolívares\`\n` +
                       `   ↳ Estado: ${state}`;
            });

            const text = `「✿」 PORTAFOLIO DE NEGOCIOS 🏪✨\n\n` +
                         `₊˚ˑ༄ Estado actual de tus establecimientos comerciales:\n\n` +
                         lines.join('\n\n') + `\n\n` +
                         `───────────────────\n` +
                         `❀ _¡Gestiona tus fondos y expande tu emporio en la red de Yuki!_ 🌸`;

            return reply(sock, m, text, [sender]);

        } catch (error) {
            console.error('Error en !minegocios:', error.message);
            return reply(sock, m, '「✿」 ERROR DE RED // No pude consultar tus negocios; inténtalo de nuevo en un momento. 🥀');
        }
    }
};
