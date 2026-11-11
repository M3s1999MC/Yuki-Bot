const { reply, randomInt } = require('../../utils/commandHelpers');

const MIN_SIDES = 2;
const MAX_SIDES = 100;

module.exports = {
    name: 'dado',
    aliases: [],
    category: 'random',
    description: 'Lanza un dado; puedes indicar entre 2 y 100 caras',

    async execute(sock, m, args, usedPrefix = '!') {
        const raw = args[0];
        const sides = raw === undefined ? 6 : Number(raw);
        if (!Number.isInteger(sides) || sides < MIN_SIDES || sides > MAX_SIDES) {
            return reply(sock, m, `「✿」 Indica un número de caras entre ${MIN_SIDES} y ${MAX_SIDES} 🎲\n_Ejemplo:_ ${usedPrefix}dado 20`);
        }
        return reply(sock, m, `「✿」 🎲 Lanzaste un dado de ${sides} caras y salió: *${randomInt(1, sides)}*`);
    },
    MIN_SIDES,
    MAX_SIDES
};
