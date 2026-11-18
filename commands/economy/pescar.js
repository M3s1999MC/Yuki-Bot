const { makeJobCommand } = require('../../utils/jobCommand');

module.exports = makeJobCommand('pescar', {
    name: 'pescar',
    aliases: ['fish', 'fishing'],
    category: 'economy',
    description: 'Lanza el anzuelo en las aguas de la red para atrapar peces y criaturas valiosas.',
    
    // Cooldown en milisegundos (ej: 20 minutos = 20 * 60 * 1000)
    cooldown: 20 * 60 * 1000,
    
    // Rango de ganancias en Bolívares ($)
    minReward: 250,
    maxReward: 950,

    // Textos personalizados con la identidad visual webcore de Yuki
    messages: {
        success: (reward, user) => 
            `「✿」 JORNADA DE PESCA EXITOSA 🎣✨\n\n` +
            `₊˚ˑ༄ ¡Tuviste buena paciencia en el muelle y atrapaste una gran especie marina para el mercado!\n` +
            `❀ 💰 *Venta de pesca:* \`+$${reward.toLocaleString('es-CO')} Bolívares\` 💵\n` +
            `───────────────────\n` +
            `❀ _¡El mar siempre recompensa a los persistentes en la red de Yuki!_ 🌸`,

        fail: (user) => 
            `「✿」 ANZUELO VACÍO 🥀\n\n` +
            `₊˚ˑ༄ Pasaste horas esperando a la orilla del agua pero ningún pez quiso morder el anzuelo.\n` +
            `───────────────────\n` +
            `❀ _¡Vuelve a intentarlo más tarde cuando la marea cambie!_ 📉`
    }
});
