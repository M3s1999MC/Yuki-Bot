const { makeJobCommand } = require('../../utils/jobCommand');

module.exports = makeJobCommand('youtuber', {
    name: 'youtuber',
    aliases: ['streamer', 'creador', 'video'],
    category: 'economy',
    description: 'Graba, edita y publica contenido para tus canales digitales en la red para ganar Bolívares.',
    
    // Cooldown en milisegundos (ej: 30 minutos = 30 * 60 * 1000)
    cooldown: 30 * 60 * 1000,
    
    // Rango de ganancias en Bolívares ($)
    minReward: 450,
    maxReward: 1800,

    // Textos personalizados con la identidad visual webcore de Yuki
    messages: {
        success: (reward, user) => 
            `「✿」 VIDEO VIRAL PUBLICADO 📹✨\n\n` +
            `₊˚ˑ༄ Editaste con efectos Y2K, añadiste miniaturas llamativas y tu comunidad hizo que el video se volviera tendencia.\n` +
            `❀ 💰 *Ingresos por monetización:* \`+$${reward.toLocaleString('es-CO')} Bolívares\` 💵\n` +
            `───────────────────\n` +
            `❀ _¡Tus canales en el ciberespacio están rompiendo récords de vistas!_ 🌸`,

        fail: (user) => 
            `「✿」 VIDEO DESMONETIZADO 🥀\n\n` +
            `₊˚ˑ༄ El algoritmo detectó copyright en tu banda sonora y el video fue bloqueado antes de conseguir visitas.\n` +
            `───────────────────\n` +
            `❀ _¡Prepara un nuevo proyecto para la próxima transmisión!_ 📉`
    }
});
