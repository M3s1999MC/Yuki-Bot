const { makeJobCommand } = require('../../utils/jobCommand');

module.exports = makeJobCommand('superalbanil', {
    name: 'superalbanil',
    aliases: ['superalbañil', 'albañil', 'albanil'],
    category: 'economy',
    description: 'Trabaja como superalbañil construyendo cimientos y estructuras en la red por Bolívares.',
    
    // Cooldown en milisegundos (ej: 30 minutos = 30 * 60 * 1000)
    cooldown: 30 * 60 * 1000,
    
    // Rango de ganancias en Bolívares ($)
    minReward: 400,
    maxReward: 1500,

    // Textos personalizados con la identidad visual webcore de Yuki
    messages: {
        success: (reward, user) => 
            `「✿」 JORNADA DE CONSTRUCCIÓN EXITOSA 🧱✨\n\n` +
            `₊˚ˑ༄ Mezclaste cemento, levantaste muros rectos y el contratista quedó fascinado con tu obra.\n` +
            `❀ 💰 *Pago recibido:* \`+$${reward.toLocaleString('es-CO')} Bolívares\` 💵\n` +
            `───────────────────\n` +
            `❀ _¡Los cimientos de la red de Yuki son más fuertes gracias a ti!_ 🌸`,

        fail: (user) => 
            `「✿」 ACCIDENTE EN LA OBRA 🥀\n\n` +
            `₊˚ˑ༄ Se te cayó la mezcla de cemento encima de las botas y el muro principal se derrumbó por completo.\n` +
            `───────────────────\n` +
            `❀ _¡Hoy la arquitectura no fue tu fuerte en el ciberespacio!_ 📉`
    }
});
