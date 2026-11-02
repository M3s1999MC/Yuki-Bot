const assert = require('node:assert/strict');
const { test } = require('node:test');
const roster = require('../utils/gachaRoster');

test('curated gacha roster contains the requested characters without duplicate entries', () => {
    const keys = roster.map(({ name, serie }) => `${serie}:${name}`);
    const series = new Set(roster.map(character => character.serie));

    assert.ok(roster.length > 0);
    assert.equal(new Set(keys).size, roster.length);
    assert.ok(series.size > 0);
    assert.ok(roster.every(character => {
        if (typeof character.imageUrl !== 'string' || !character.imageUrl.trim()) return false;
        try {
            const imageUrl = new URL(character.imageUrl);
            return imageUrl.protocol === 'https:'
                && (imageUrl.hostname === 'i.pinimg.com'
                    || imageUrl.hostname === 'pinterest.com'
                    || imageUrl.hostname.endsWith('.pinterest.com')
                    || imageUrl.hostname === 'pin.it'
                    || imageUrl.hostname.endsWith('.pin.it'));
        } catch {
            return false;
        }
    }));
    assert.ok(roster.some(character => character.name === 'Special Week'));
});
