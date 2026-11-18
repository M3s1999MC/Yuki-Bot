const economy = require('../../utils/economy');
const adventure = require('../../utils/adventure');
const { reply, senderJid } = require('../../utils/commandHelpers');

module.exports = {
    name: 'curar',
    aliases: ['heal'],
    category: 'economy',
    description: 'Cura tu salud para salir de aventuras (10 Bolívares por punto de vida)',

    async execute(sock, m) {
        try {
            const jid = senderJid(m, sock);
            const result = await adventure.heal(jid);

            if (!result.ok && result.reason === 'full') {
                return reply(sock, m, 
                    `(「✿」 "SALUD AL MÁXIMO" ❤️)\n\n` +
                    `₊˚ˑ༄ Ya tienes toda tu vitalidad recuperada.\n` +
                    `❀ 🫀 *Vida actual:* \`${result.hp}/${adventure.MAX_HP}\` 🌸`
                );
            }

            if (!result.ok) {
                const costoPunto = typeof result.needed === 'number' ? result.needed.toLocaleString('es-CO') : result.needed;
                return reply(sock, m, 
                    `(「✿」 "FONDOS INSUFICIENTES" 🥀)\n\n` +
                    `₊˚ˑ༄ No te alcanza ni para curar un solo punto de vida.\n` +
                    `❀ 💸 *Costo por punto:* \`$${costoPunto} Bolívares\`\n` +
                    `❀ ❤️ *Vida actual:* \`${result.hp}/${adventure.MAX_HP}\` 📉`
                );
            }

            const costoTotal = typeof result.cost === 'number' ? result.cost.toLocaleString('es-CO') : result.cost;

            return reply(sock, m, 
                `(「✿」 "CURACIÓN COMPLETADA" 🩹✨)\n\n` +
                `₊˚ˑ༄ Tus heridas han sido tratadas en la enfermería de la red.\n` +
                `❀ ✨ *Puntos curados:* \`+${result.healed} HP\`\n` +
                `❀ 💸 *Costo total:* \`-$${costoTotal} Bolívares\`\n` +
                `───────────────────\n` +
                `❀ ❤️ *Vida actual:* \`${result.hp}/${adventure.MAX_HP}\` 🌸`
            );

        } catch (error) {
            console.error('Error en !curar:', error.message);
            return reply(sock, m, '(「✿」 "ERROR DE SISTEMA" 🥀)\n\nNo pude procesar tu curación; inténtalo de nuevo en un momento.');
        }
    }
};
