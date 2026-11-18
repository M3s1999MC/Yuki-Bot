const { makeJobCommand } = require('../../utils/jobCommand');

module.exports = makeJobCommand('cazar', {
    name: 'cazar',
    aliases: ['hunt'],
    category: 'economy',
    description: 'Sal a cazar en la selva o el multiverso para ganar Bolívares.',
    
    // Cooldown en milisegundos (ej: 30 minutos = 30 * 60 * 1000)
    cooldown: 30 * 60 * 1000,
    
    // Rango de ganancias en Bolívares ($)
    minReward: 300,
    maxReward: 1200,

    // Textos personalizados con la estética de Yuki y las florecitas
    messages: {
        success: (reward, user) => 
            `(「✿」 "¡CAZA EXITOSA!" 🌸)\n\n` +
            `₊˚ˑ༄ Te adentraste en lo profundo del bosque digital y atrapaste una bestia legendaria.\n` +
            `❀ 💰 *Recompensa:* \`+$${reward.toLocaleString('es-CO')} Bolívares\` 💵\n` +
            `───────────────────\n` +
            `❀ ¡Buen trabajo, cazador! 🌿`,

        fail: (user) => 
            `(「✿」 "CAZA FALLIDA" 🥀)\n\n` +
            `₊˚ˑ༄ Te tropezaste con una rama, la presa escapó y no conseguiste nada en la expedición.\n` +
            `❀ ¡Más suerte para la próxima, tonto! 📉`
    }
});
