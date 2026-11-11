const { reply, pickOne } = require('../../utils/commandHelpers');

const phrases = [
    'Un paso pequeño hoy vale más que un plan perfecto mañana.',
    'Descansar también es avanzar.',
    'No tienes que hacerlo todo hoy; solo no te rindas con lo importante.',
    'Equivocarte es la prueba de que lo estás intentando.',
    'Si algo te asusta y te emociona a la vez, probablemente vale la pena.',
    'Sé amable contigo: estás aprendiendo mientras lo haces.',
    'Pedir ayuda no es debilidad; nadie construye solo.',
    'Hoy es un buen día para empezar lo que has pospuesto.',
    'La constancia le gana al talento cuando el talento no se esfuerza.',
    'No compares tu capítulo uno con el capítulo veinte de otra persona.',
    'A veces lo mejor que puedes hacer es respirar hondo y seguir.',
    'Lo que hoy te cuesta, mañana será tu costumbre.',
    'Cuida a quienes te escuchan sin que tengas que explicarte demasiado.',
    'Un "no" de hoy no es un "nunca" de mañana.',
    'Termina lo que empezaste y empieza lo que te hace ilusión.',
    'Tu ritmo es válido, aunque no sea el de los demás.',
    'Agradece lo pequeño: casi siempre es lo que sostiene todo.',
    'Aprende de ayer, vive hoy y deja algo de curiosidad para mañana.',
    'No esperes a estar listo; empieza y te vas preparando en el camino.',
    'Un buen descanso, un buen plato de comida y buena compañía arreglan más de lo que parece.',
    'Si te cansas, descansa; pero no abandones.',
    'Haz una cosa a la vez y hazla con cariño.',
    'La disciplina es recordar lo que de verdad quieres cuando no tienes ganas.',
    'Está bien cambiar de idea cuando aprendes algo nuevo.'
];

module.exports = {
    name: 'frase',
    aliases: ['consejo'], // 'quote' ya pertenece al comando de stickers qc
    category: 'random',
    description: 'Muestra un pensamiento aleatorio o un consejo',

    async execute(sock, m) {
        return reply(sock, m, `「✿」 🌸 _${pickOne(phrases)}_`);
    },
    phrases
};
