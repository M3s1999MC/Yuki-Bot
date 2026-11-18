const { makeJobCommand } = require('../../utils/jobCommand');

module.exports = makeJobCommand('migajear', {
    name: 'migajear',
    aliases: ['migajas', 'pedir'],
    category: 'economy',
    description: 'Pide limosna o busca migajas por las calles de la red para sobrevivir.',
    
    // Cooldown en milisegundos (ej: 15 minutos = 15 * 60 * 1000)
    cooldown: 15 * 60 * 1000,
    
    // Rango de ganancias en Bolívares ($) (humilde pero seguro)
    minReward: 100,
    maxReward: 450,

    // Textos personalizados con la identidad visual de Yuki
    messages: {
        success: (reward, user) => 
            `「✿」 LIMOSNA RECOLECTADA 🪙✨\n\n` +
            `₊˚ˑ༄ Alguien compadeció de tu situación y te dejó unas cuantas monedas en el sombrero.\n` +
            `❀ 💰 *Monedas obtenidas:* \`+$${reward.toLocaleString('es-CO')} Bolívares\` 💵\n` +
            `───────────────────\n` +
            `❀ _¡De grano en grano se llena el granero en la red de Yuki!_ 🌸`,

        fail: (user) => 
            `「✿」 RECHAZADO EN LA CALLE 🥀\n\n` +
            `₊˚ˑ༄ Nadie te quiso dar ni una sola migaja y hasta te echaron un vaso de agua fría.\n` +
            `───────────────────\n` +
            `❀ _¡Qué dura es la vida del limosnero en el ciberespacio!_ 📉`
    }
});
