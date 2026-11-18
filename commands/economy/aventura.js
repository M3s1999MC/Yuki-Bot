const economy = require('../../utils/economy');
const adventure = require('../../utils/adventure');
const { formatDuration } = require('../../utils/cooldowns');
const { reply, senderJid } = require('../../utils/commandHelpers');

module.exports = {
    name: 'aventura',
    aliases: ['adventure'],
    category: 'economy',
    description: 'Ir de aventuras para ganar Bolívares; gasta vida (cada 45 minutos). Cúrate con !curar',

    async execute(sock, m, args, usedPrefix = '!') {
        try {
            const result = await adventure.performAdventure(senderJid(m, sock));
            
            if (!result.ok && result.reason === 'hurt') {
                return reply(sock, m, 
                    `₊˚ˑ༄ 𝖄𝖚𝖐𝖎 // ZONA DE PELIGRO 🩹\n\n` +
                    `❀ ❟ Estás demasiado herido para salir de expedición.\n` +
                    `❀ 🫀 *Vida actual:* \`${result.hp}/${adventure.MAX_HP}\`\n` +
                    `❀ ❟ Necesitas al menos ${adventure.MIN_HP_TO_GO} de HP.\n` +
                    `❀ Usa *${usedPrefix}curar* o espera (recuperas 1 HP por minuto). 🥀`
                );
            }

            if (!result.ok) {
                return reply(sock, m, 
                    `₊˚ˑ༄ 𝖄𝖚𝖐𝖎 // DESCANSO REQUERIDO ⏳\n\n` +
                    `❀ ❟ Aún estás recuperando el aliento de tu última aventura.\n` +
                    `❀ ❟ Podrás volver en: *${formatDuration(result.remainingMs)}* ☕`
                );
            }

            const hpLine = `❤️ *Vida:* \`${result.hp}/${adventure.MAX_HP}\` (−${result.hpLost} HP)`;
            const cantidadFormateada = typeof result.amount === 'number' ? result.amount.toLocaleString('en-US') : result.amount;

            if (result.success) {
                return reply(sock, m, 
                    `₊˚ˑ༄ 𝖄𝖚𝖐𝖎 // EXPEDICIÓN EXITOSA 🗺️✨\n\n` +
                    `❀ ❟ ${result.text}\n\n` +
                    `❀ 💰 *Recompensa:* \`+$${cantidadFormateada} Bolívares\`\n` +
                    `❀ ✨ *Experiencia:* \`+30 XP\`\n` +
                    `───────────────────\n` +
                    `❀ ${hpLine} 🌸`
                );
            }
            
            return reply(sock, m, 
                `₊˚ˑ༄ 𝖄𝖚𝖐𝖎 // EXPEDICIÓN FALLIDA 💀📉\n\n` +
                `❀ ❟ ${result.text}\n\n` +
                `❀ 💸 *Multa / Pérdida:* \`-$${cantidadFormateada} Bolívares\`\n` +
                `───────────────────\n` +
                `❀ ${hpLine} 🥀`
            );

        } catch (error) {
            console.error('Error en !aventura:', error.message);
            return reply(sock, m, '₊˚ˑ༄ [!] Ocurrió un fallo en la red dimensional. Inténtalo de nuevo en un momento. 🥀');
        }
    }
};
