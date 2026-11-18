const { makeJobCommand } = require('../../utils/jobCommand');

module.exports = makeJobCommand('explorar', {
    name: 'explorar',
    aliases: ['explore', 'aventura'],
    category: 'economy',
    description: 'Explora rincones inexplorados del ciberespacio en busca de Bolívares y tesoros.',
    
    // Cooldown en milisegundos (ej: 30 minutos = 30 * 60 * 1000)
    cooldown: 30 * 60 * 1000,
    
    // Rango de ganancias en Bolívares ($)
    minReward: 350,
    maxReward: 1300,

    // Textos personalizados con la identidad visual de Yuki
    messages: {
        success: (reward, user) => 
            `「✿」 EXPLORACIÓN EXITOSA 🧭✨\n\n` +
            `₊˚ˑ༄ Te adentraste en sectores desconocidos de la red y descubriste un alijo de datos olvidados.\n` +
            `❀ 💰 *Tesoro hallado:* \`+$${reward.toLocaleString('es-CO')} Bolívares\` 💵\n` +
            `───────────────────\n` +
            `❀ _¡Una expedición de lo más fructífera en el ciberespacio!_ 🌸`,

        fail: (user) => 
            `「✿」 EXPLORACIÓN FALLIDA 🥀\n\n` +
            `₊˚ˑ༄ Te perdiste en un laberinto de código corrupto y tuviste que regresar con las manos vacías.\n` +
            `───────────────────\n` +
            `❀ _¡Ten más cuidado la próxima vez que salgas de ruta, viajero!_ 📉`
    }
});
