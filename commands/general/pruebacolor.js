const { reply } = require('../../utils/commandHelpers');

module.exports = {
    name: 'pruebacolor',
    aliases: ['testformat', 'prueba'],
    category: 'general',
    description: 'Prueba de formato de texto especial con estilo Yuki',

    async execute(sock, m) {
        const text = [
            `₊˚ˑ༄ 𝖄𝖚𝖐𝖎 // SYSTEM TEST 𓍢ִ໋☕`,
            ``,
            `❀ ❟ *Texto en Negrita*`,
            `❀ ❟ _Texto en Cursiva_`,
            `❀ ❟ ~Texto Tachado~`,
            `❀ ❟ \`Texto Monoespaciado\`\n`,
            `> Bloque de cita institucional bajo los protocolos de la red. 🪞\n`,
            `• Elemento listado de prueba 1`,
            `• Elemento listado de prueba 2`,
            `1. Secuencia numérica alineada 01`,
            `2. Secuencia numérica alineada 02\n`,
            `° 𐐪𐑂 Módulos de formato operando con normalidad. ✿`
        ].join('\n');

        return reply(sock, m, text);
    }
};
