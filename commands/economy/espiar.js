const { makeJobCommand } = require('../../utils/jobCommand');

module.exports = makeJobCommand('espiar', {
    name: 'espiar',
    aliases: ['spy', 'vigilar'],
    category: 'economy',
    description: 'Infiltrate en instalaciones confidenciales de la red para robar información y Bolívares.',
    
    // Cooldown en milisegundos (ej: 35 minutos = 35 * 60 * 1000)
    cooldown: 35 * 60 * 1000,
    
    // Rango de ganancias en Bolívares ($)
    minReward: 400,
    maxReward: 1400,

    // Textos personalizados con el diseño limpio y estético de Yuki
    messages: {
        success: (reward, user) => 
            `「✿」 MISIÓN DE ESPIONAJE EXITOSA 🕵️‍♂️✨\n\n` +
            `₊˚ˑ༄ Te infiltraste sigilosamente en los servidores de la corporación y extrajiste datos valiosos.\n` +
            `❀ 💰 *Recompensa obtenida:* \`+$${reward.toLocaleString('es-CO')} Bolívares\` 💵\n` +
            `───────────────────\n` +
            `❀ _¡Nadie vio venir tu jugada maestro del sigilo!_ 🌸`,

        fail: (user) => 
            `「✿」 ESPIONAJE DESCUBIERTO 🥀\n\n` +
            `₊˚ˑ༄ Activaste una trampa de seguridad y la red te expulsó antes de robar nada.\n` +
            `───────────────────\n` +
            `❀ _¡Más suerte para la próxima, agente encubierto!_ 📉`
    }
});
