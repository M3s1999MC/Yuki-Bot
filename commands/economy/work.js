const { makeJobCommand } = require('../../utils/jobCommand');

module.exports = makeJobCommand('work', {
    name: 'work',
    aliases: ['w', 'trabajar'],
    category: 'economy',
    description: 'Realiza una jornada laboral en diversos oficios de la red para ganar Bolívares.',
    
    // Cooldown en milisegundos (ej: 30 minutos = 30 * 60 * 1000)
    cooldown: 30 * 60 * 1000,
    
    // Rango de ganancias en Bolívares ($)
    minReward: 500,
    maxReward: 2000,

    // Textos personalizados con la identidad visual webcore y temática de Yuki
    messages: {
        success: (reward, user) => {
            const trabajos = [
                'repostero de pasteles de fresa',
                'asistente en la librería digital de Akihabara',
                'repartidor de ramen a domicilio por el ciberespacio',
                'organizador de estanterías y servidores en el supermercado'
            ];
            const trabajoElegido = trabajos[Math.floor(Math.random() * trabajos.length)];

            return `「✿」 JORNADA DE TRABAJO COMPLETADA 💼✨\n\n` +
                   `₊˚ˑ༄ Trabajaste duro y con dedicación como *${trabajoElegido}*.\n` +
                   `❀ 💰 *Pago recibido:* \`+$${reward.toLocaleString('es-CO')} Bolívares\` 💵\n` +
                   `───────────────────\n` +
                   `❀ _¡Tu esfuerzo impulsa la economía de la red de Yuki!_ 🌸`;
        },

        fail: (user) => 
            `「✿」 JORNADA LABORAL FALLIDA 🥀\n\n` +
            `₊˚ˑ༄ Te quedaste dormido en el puesto de trabajo y el jefe decidió descontarte el día entero.\n` +
            `───────────────────\n` +
            `❀ _¡Inténtalo de nuevo cuando recuperes energías en el ciberespacio!_ 📉`
    }
});
