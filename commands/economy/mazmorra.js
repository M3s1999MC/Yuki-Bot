const { makeJobCommand } = require('../../utils/jobCommand');

module.exports = makeJobCommand('mazmorra', {
    name: 'mazmorra',
    aliases: ['dungeon', 'calabozo'],
    category: 'economy',
    description: 'Adéntrate en las profundidades de una mazmorra oscura para enfrentar monstruos y saquear tesoros.',
    
    // Cooldown en milisegundos (ej: 40 minutos = 40 * 60 * 1000)
    cooldown: 40 * 60 * 1000,
    
    // Rango de ganancias en Bolívares ($)
    minReward: 600,
    maxReward: 2000,

    // Textos personalizados con la identidad visual y webcore de Yuki
    messages: {
        success: (reward, user) => 
            `「✿」 MAZMORRA SUPERADA ⚔️✨\n\n` +
            `₊˚ˑ༄ ¡Derrotaste a las criaturas del abismo y saliste victorioso con el cofre del tesoro!\n` +
            `❀ 💰 *Botín saqueado:* \`+$${reward.toLocaleString('es-CO')} Bolívares\` 💵\n` +
            `───────────────────\n` +
            `❀ _¡Un auténtico héroe de leyendas en la red de Yuki!_ 🌸`,

        fail: (user) => 
            `「✿」 DERROTADO EN LA MAZMORRA 🥀\n\n` +
            `₊˚ˑ༄ Los monstruos te superaron en número y tuviste que huir arrastrándote sin ninguna recompensa.\n` +
            `───────────────────\n` +
            `❀ _¡Entrena más y mejora tu equipo antes de volver a bajar!_ 📉`
    }
});