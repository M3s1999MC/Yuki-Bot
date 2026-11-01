const sessions = new Map();

const replies = [
    'Qué interesante 😊 ¿cómo empezaste con eso?',
    'Me gusta esa respuesta. ¿Qué sería un día perfecto para ti?',
    'Jajaja, eso me dio curiosidad. Cuéntame un poquito más 🌸',
    'Creo que tenemos tema para rato ✨ ¿qué otra cosa disfrutas hacer?',
    'Buena pregunta para conocernos mejor: ¿qué plan te gustaría hacer este fin de semana?'
];

function respond(text, session) {
    session.turns += 1;
    const normalized = text.toLowerCase();
    if (/\b(hola|hey|buenas)\b/.test(normalized)) return '¡Hola! Qué gusto leerte 😊 ¿cómo estuvo tu día?';
    if (/\b(gracias|jaja|jeje|😂)\b/.test(normalized)) return 'Me alegra sacarte una sonrisa 😄 ¿qué más te gusta hacer?';
    return replies[(session.turns - 1) % replies.length];
}

module.exports = { sessions, respond };
