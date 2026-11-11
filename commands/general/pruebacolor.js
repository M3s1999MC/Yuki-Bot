const { reply } = require('../../utils/commandHelpers');

module.exports = {
    name: 'pruebacolor',
    aliases: [],
    category: 'general',
    description: 'Prueba de formato de texto especial',

    async execute(sock, m) {
        const text = [
            '「✿」 *Prueba de formato*',
            '',
            '*Negrita*',
            '_Cursiva_',
            '~Tachado~',
            '```Monoespaciado```',
            '> Cita',
            '',
            '• Lista con viñetas',
            '1. Lista numerada',
            '',
            'Si ves los estilos de arriba, el formato funciona. 🌸'
        ].join('\n');
        return reply(sock, m, text);
    }
};
