const assert = require('node:assert/strict');
const { test } = require('node:test');
const roster = require('../utils/gachaRoster');

test('curated gacha roster contains the requested characters without duplicate entries', () => {
    const keys = roster.map(({ name, serie }) => `${serie}:${name}`);
    const series = new Set(roster.map(character => character.serie));

    assert.equal(roster.length, 116);
    assert.equal(new Set(keys).size, roster.length);
    assert.equal(series.size, 19);
    assert.ok(roster.every(character => typeof character.imageUrl === 'string'));
    assert.ok(roster.some(character => character.name === 'Hakari Hanazono'));
    assert.ok(roster.some(character => character.name === 'Special Week'));
});
