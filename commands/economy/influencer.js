const { makeJobCommand } = require('../../utils/jobCommand');

module.exports = makeJobCommand('influencer', {
    name: 'influencer',
    aliases: ['streamer', 'creador'],
    category: 'economy',
    description: 'Haz directos o contenido viral en las redes de Yuki para ganar seguidores y Bolívares.',
    
    // Cooldown en milisegundos (ej: 30 minutos = 30 * 60 * 1000)
    cooldown: 30 * 60 * 1000,
    
    // Rango de ganancias en Bolívares ($)
    minReward: 400,
    maxReward: 1500,

    // Textos personalizados con la identidad visual de Yuki
    messages: {
        success: (reward, user) => 
            `「✿」 STREAM VIRAL EXITOSO 🎥✨\n\n` +
            `₊˚ˑ༄ ¡Tu transmisión en vivo rompió récords de audiencia en la red y monetizaste con donaciones!\n` +
            `❀ 💰 *Ganancias obtenidas:* \`+$${reward.toLocaleString('es-CO')} Bolívares\` 💵\n` +
            `───────────────────\n` +
            `❀ _¡Todo un ícono de las redes sociales en el cIBERESPACIO!_ 🌸`,

        fail: (user) => 
            `「✿」 CANCELADO EN VIVO 🥀\n\n` +
            `₊˚ˑ༄ Nadie vio tu transmisión y el chat se llenó de hate; tuviste que apagar la cámara avergonzado.\n` +
            `───────────────────\n` +
            `❀ _¡Mejor suerte con el próximo contenido, streamer novato!_ 📉`
    }
});
