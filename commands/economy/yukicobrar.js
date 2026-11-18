const { collectAll } = require('../../utils/businesses');
const missions = require('../../utils/missions');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'yukicobrar',
    aliases: ['yukiclaim', 'reclamarnegocios', 'cobrarnegocios', 'ygc'],
    category: 'economy',
    description: 'Cobra las ganancias acumuladas de todos tus negocios y empresas en la red.',

    async execute(sock, m, args, usedPrefix = '!') {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const username = sender.split('@')[0];

        try {
            const result = await collectAll(sender);

            if (!result.owned) {
                return sock.sendMessage(jid, { 
                    text: `「✿」 SIN NEGOCIOS REGISTRADOS 🥀\n\n₊˚ˑ༄ Aún no posees empresas en el ciberespacio.\n❀ *Explora el catálogo con:* \`${usedPrefix}negocios\` 🌸` 
                }, { quoted: m });
            }

            if (result.total <= 0) {
                return sock.sendMessage(jid, { 
                    text: `「✿」 SIN GANANCIAS POR COBRAR ⏳\n\n₊˚ˑ༄ Tus negocios todavía están generando fondos.\n❀ *Revisa el mantenimiento con:* \`${usedPrefix}minegocios\` 🌸` 
                }, { quoted: m });
            }

            // Registrar avance de misiones si aplica
            await missions.track(sender, 'negocio');

            const detail = result.details.map(item => {
                const amountFormatted = Number(item.amount || 0).toLocaleString('es-CO');
                return `❀ ${item.business.emoji} ${item.business.name}: \`+$${amountFormatted} Bolívares\``;
            }).join('\n');

            const totalFormatted = Number(result.total || 0).toLocaleString('es-CO');

            const text = `「✿」 GANANCIAS DE NEGOCIOS COBRADAS 🏢✨\n\n` +
                         `₊˚ˑ༄ Has recolectado los ingresos de tus empresas en la red:\n\n` +
                         detail + `\n\n` +
                         `───────────────────\n` +
                         `❀ 👤 *Propietario:* @${username}\n` +
                         `❀ 💰 *Total ingresado:* \`+$${totalFormatted} Bolívares\` 💵\n` +
                         `───────────────────\n` +
                         `❀ _¡Tu imperio empresarial en el ciberespacio sigue creciendo!_ 🌸`;

            await sock.sendMessage(jid, { text, mentions: [sender] }, { quoted: m });
        } catch (error) {
            console.error('Error en !yukicobrar:', error.message);
            return sock.sendMessage(jid, { text: '「✿」 ERROR CRÍTICO // No pude cobrar las ganancias de tus negocios. 🥀' }, { quoted: m });
        }
    }
};
