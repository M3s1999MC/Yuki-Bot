const test = require('node:test');
const assert = require('node:assert/strict');
const { REACTIONS } = require('../utils/reactions');
const { GROUPS, INFO } = require('../utils/reactionInfo');

const ACTIONS = ['hug', 'kiss', 'cuddle', 'pat', 'wink', 'slap', 'poke', 'kill'];

test('cada reacción y cada acción tiene grupo y descripción para el menú', () => {
    const groups = new Set(GROUPS.map(group => group.id));
    for (const key of [...REACTIONS.map(item => item.key), ...ACTIONS]) {
        assert.ok(INFO[key], `falta la descripción de "${key}"`);
        assert.ok(groups.has(INFO[key][0]), `"${key}" usa un grupo desconocido`);
        assert.ok(INFO[key][1].length >= 4, `descripción muy corta en "${key}"`);
    }
    const known = new Set([...REACTIONS.map(item => item.key), ...ACTIONS]);
    for (const key of Object.keys(INFO)) assert.ok(known.has(key), `"${key}" no es una reacción ni una acción`);
});
