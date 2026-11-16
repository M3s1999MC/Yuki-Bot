const economy = require('../../utils/economy');
const adventure = require('../../utils/adventure');
const { reply, senderJid } = require('../../utils/commandHelpers');

module.exports = {
    name: 'curar',
    aliases: ['heal'],
    category: 'economy',
    description: 'Cura tu salud para salir de aventuras (10 monedas por punto de vida)',

    async execute(sock, m) {
        try {
            const jid = senderJid(m, sock);
            const result = await adventure.heal(jid);
            if (!result.ok && result.reason === 'full') return reply(sock, m, `「✿」 ❤️ Ya tienes la vida completa (${result.hp}/${adventure.MAX_HP}).`);
            if (!result.ok) return reply(sock, m, `「✿」 No te alcanza ni para un punto de vida: cada uno cuesta ${economy.money(result.needed)} en tu billetera. Tienes ❤️ ${result.hp}/${adventure.MAX_HP}.`);
            return reply(sock, m, `「✿」 🩹 Te curaste *${result.healed}* puntos por ${economy.money(result.cost)}. Vida: ❤️ ${result.hp}/${adventure.MAX_HP}.`);
        } catch (error) {
            console.error('Error en !curar:', error.message);
            return reply(sock, m, '「✿」 No pude curarte; inténtalo de nuevo en un momento.');
        }
    }
};
