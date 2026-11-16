const economy = require('../../utils/economy');
const adventure = require('../../utils/adventure');
const { formatDuration } = require('../../utils/cooldowns');
const { reply, senderJid } = require('../../utils/commandHelpers');

module.exports = {
    name: 'aventura',
    aliases: ['adventure'],
    category: 'economy',
    description: 'Ir de aventuras para ganar monedas; gasta vida (cada 45 minutos). Cúrate con !curar',

    async execute(sock, m, args, usedPrefix = '!') {
        try {
            const result = await adventure.performAdventure(senderJid(m, sock));
            if (!result.ok && result.reason === 'hurt') {
                return reply(sock, m, `「✿」 🩹 Estás muy herido para salir (❤️ ${result.hp}/${adventure.MAX_HP}). Necesitas al menos ${adventure.MIN_HP_TO_GO}. Usa *${usedPrefix}curar* o espera: recuperas 1 punto por minuto.`);
            }
            if (!result.ok) return reply(sock, m, `「✿」 ⏳ Aún estás descansando de tu última aventura. Vuelve en *${formatDuration(result.remainingMs)}*.`);
            const hpLine = `❤️ Vida: ${result.hp}/${adventure.MAX_HP} (−${result.hpLost})`;
            if (result.success) return reply(sock, m, `「✿」 🗺️ *Aventura*\n${result.text}\n\n*+${economy.money(result.amount)}* y +30 XP 🌸\n${hpLine}`);
            return reply(sock, m, `「✿」 🗺️ *Aventura fallida*\n${result.text}\n\n*−${economy.money(result.amount)}*\n${hpLine}`);
        } catch (error) {
            console.error('Error en !aventura:', error.message);
            return reply(sock, m, '「✿」 No pude completar la aventura; inténtalo de nuevo en un momento.');
        }
    }
};
