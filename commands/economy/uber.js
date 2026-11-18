const { makeJobCommand } = require('../../utils/jobCommand');

module.exports = makeJobCommand('uber', {
    name: 'uber',
    aliases: ['taxista', 'conducir', 'taxi'],
    category: 'economy',
    description: 'Realiza viajes como conductor de Uber por las calles digitales de la red para ganar Bolívares.',
    
    // Cooldown en milisegundos (ej: 25 minutos = 25 * 60 * 1000)
    cooldown: 25 * 60 * 1000,
    
    // Rango de ganancias en Bolívares ($)
    minReward: 350,
    maxReward: 1300,

    // Textos personalizados con la identidad visual webcore de Yuki
    messages: {
        success: (reward, user) => 
            `「✿」 VIAJE DE UBER COMPLETADO 🚖✨\n\n` +
            `₊˚ˑ༄ Recogiste a un pasajero VIP, esquivaste el tráfico virtual y llegaste a destino con excelente propina.\n` +
            `❀ 💰 *Tarifa cobrada:* \`+$${reward.toLocaleString('es-CO')} Bolívares\` 💵\n` +
            `───────────────────\n` +
            `❀ _¡El servicio de transporte en la red de Yuki marcha sobre ruedas!_ 🌸`,

        fail: (user) => 
            `「✿」 CARRERA CANCELADA 🥀\n\n` +
            `₊˚ˑ༄ Tu GPS falló en medio del camino, el pasajero canceló el viaje y te quedaste sin combustible digital.\n` +
            `───────────────────\n` +
            `❀ _¡Vuelve a encender el motor cuando el sistema se recupere!_ 📉`
    }
});
