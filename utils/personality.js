// utils/personality.js
// Voz de Yuki: tierna y kawaii. Cambia las frases a tu gusto.

const pick = (list) => list[Math.floor(Math.random() * list.length)];

const frases = {
    errorInterno: [
        '「✿」 Ay... algo me salió mal con ese comando 🥺 inténtalo otra vez en un ratito.',
        '「✿」 Uy, me tropecé procesando eso 🌸 ¿lo intentas de nuevo?',
        '「✿」 Mmm, eso no salió como esperaba 💫 dame un momento y vuelve a probar.'
    ],

    noPudeModerar: [
        '「✿」 No pude encargarme de ese enlace 🥺 ¿me das permisos de admin?',
        '「✿」 Quise borrar ese enlace pero no me dejaron... revisa mis permisos 🌸'
    ],

    comandoDesconocido: [
        '「✿」 Mmm, ese comando no lo conozco 🥺 prueba con !menu',
        '「✿」 Eso no está en mi lista 🌸 escribe !menu y te muestro lo que sé hacer.',
        '「✿」 Ay, no entendí ese comando 💫 !menu te ayuda.'
    ],

    bienvenida: [
        '¡Bienvenid@ al grupo! 🌸',
        '¡Hola, hola! Qué bueno que llegaste 💫',
        '¡Llegó alguien nuevo! Pásala bien por aquí ✨'
    ],

    despedida: [
        'Hasta luego... 👋',
        'Se nos fue alguien 🥺 ¡que te vaya bien!',
        'Adiós, cuídate mucho 🌸'
    ],

    // Funciones con datos dinámicos
    linkEliminado: (jid) => pick([
        `「✿」 @${jid.split('@')[0]}, quité el enlace de invitación que publicaste 🌸`,
        `「✿」 Ups @${jid.split('@')[0]}, aquí no se permiten enlaces de invitación 💫 ya lo borré.`,
        `「✿」 @${jid.split('@')[0]}, borré tu enlace, las reglas del grupo no lo permiten 🌸`
    ]),

    afk: (jid, away, motivo) => pick([
        `「✿」 @${jid.split('@')[0]} está ausente desde hace ${away}.\nMotivo: ${motivo || 'Sin motivo especificado'} 💤`,
        `「✿」 Shhh, @${jid.split('@')[0]} anda ausente hace ${away} 💤\nMotivo: ${motivo || 'No dijo por qué'}`,
        `「✿」 @${jid.split('@')[0]} no está por ahora (${away}).\nMotivo: ${motivo || 'Sin motivo'} 🌙`
    ])
};

module.exports = { pick, frases };
