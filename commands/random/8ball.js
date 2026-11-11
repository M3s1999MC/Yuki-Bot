const { reply, pickOne } = require('../../utils/commandHelpers');

const answers = [
    'Sí, definitivamente.', 'Todo apunta a que sí.', 'Sin duda alguna.', 'Puedes contar con ello.',
    'Las señales dicen que sí.', 'Es muy probable.',
    'Pregúntame de nuevo más tarde.', 'Mejor no te lo digo ahora.', 'No puedo predecirlo todavía.',
    'Concéntrate y vuelve a preguntar.',
    'No cuentes con ello.', 'Mi respuesta es no.', 'Mis fuentes dicen que no.', 'Lo veo muy dudoso.',
    'Definitivamente no.'
];

module.exports = {
    name: '8ball',
    aliases: ['pregunta', 'duda'],
    category: 'random',
    description: 'Consulta a la bola mágica una pregunta de Sí/No',

    async execute(sock, m, args, usedPrefix = '!') {
        const question = args.join(' ').trim();
        if (!question) {
            return reply(sock, m, `「✿」 Hazme una pregunta de sí o no 🎱\n_Ejemplo:_ ${usedPrefix}8ball ¿Hoy será un buen día?`);
        }
        return reply(sock, m, `「✿」 🎱 *${question}*\n\n${pickOne(answers)}`);
    },
    answers
};
