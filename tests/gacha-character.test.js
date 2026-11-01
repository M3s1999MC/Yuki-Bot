const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createFallbackCharacter } = require('../utils/gachaCharacter');

test('local gacha character fallback returns all fields required by genchar', () => {
    const character = createFallbackCharacter();

    for (const field of ['name', 'role', 'description', 'design', 'personality', 'pinterest_query']) {
        assert.equal(typeof character[field], 'string');
        assert.ok(character[field].trim());
    }
});
