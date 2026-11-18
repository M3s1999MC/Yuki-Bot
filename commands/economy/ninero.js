const { makeJobCommand } = require('../../utils/jobCommand');

module.exports = makeJobCommand('ninero', {
    name: 'ninero',
    aliases: ['ninera', 'nineriar'],
    category: 'economy',
    description: 'Cuida niños traviesos en el vecindario para ganar una propina en Bolívares.',
    
    // Cooldown en milisegundos (ej: 25 minutos = 25 * 60 * 1000)
    cooldown: 25 * 60 * 1000,
    
    // Rango de ganancias en Bolívares ($)
    minReward: 300,
    maxReward: 1200,

    // Textos personalizados con la identidad visual de Yuki
    messages: {
        success: (reward, user) => 
            `「✿」 JORNADA DE NIÑERO EXITOSA 🍼✨\n\n` +
            `₊˚ˑ༄ Lograste calificar a los niños, ordenar la sala y sobrevivir a la tarde sin desmayarte.\n` +
            `❀ 💰 *Pago recibido:* \`+$${reward.toLocaleString('es-CO')} Bolívares\` 💵\n` +
            `───────────────────\n` +
            `❀ _¡Tus nervios de acero dieron frutos en la red de Yuki!_ 🌸`,

        fail: (user) => 
            `「✿」 CAOS TOTAL EN LA CASA 🥀\n\n` +
            `₊˚ˑ༄ Los niños destruyeron la mitad de los juguetes, rompieron un jarrón y los padres te echaron sin pagar.\n` +
            `───────────────────\n` +
            `❀ _¡Cuidar infantes en el ciberespacio es deporte extremo!_ 📉`
    }
});
