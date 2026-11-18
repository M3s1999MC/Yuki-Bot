const { makeJobCommand } = require('../../utils/jobCommand');

module.exports = makeJobCommand('vendedor', {
    name: 'vendedor',
    aliases: ['vender', 'mercader', 'comerciar'],
    category: 'economy',
    description: 'Trabaja como vendedor ambulante ofreciendo productos por las calles digitales para ganar Bolívares.',
    
    // Cooldown en milisegundos (ej: 25 minutos = 25 * 60 * 1000)
    cooldown: 25 * 60 * 1000,
    
    // Rango de ganancias en Bolívares ($)
    minReward: 300,
    maxReward: 1250,

    // Textos personalizados con la identidad visual webcore de Yuki
    messages: {
        success: (reward, user) => 
            `「✿」 JORNADA DE VENTAS EXITOSA 🎒✨\n\n` +
            `₊˚ˑ༄ Instalaste tu puesto ambulante en el mercado virtual y vendiste mercancía a varios clientes hambrientos de novedades.\n` +
            `❀ 💰 *Ganancias obtenidas:* \`+$${reward.toLocaleString('es-CO')} Bolívares\` 💵\n` +
            `───────────────────\n` +
            `❀ _¡El comercio en la red de Yuki marcha a la perfección!_ 🌸`,

        fail: (user) => 
            `「✿」 DÍA DE BAJAS VENTAS 🥀\n\n` +
            `₊˚ˑ༄ Nadie se detuvo a mirar tu puesto ambulante y tuviste que cerrar antes de tiempo por falta de clientela.\n` +
            `───────────────────\n` +
            `❀ _¡Vuelve a abrir tu tienda más tarde cuando haya más tráfico en la red!_ 📉`
    }
});
