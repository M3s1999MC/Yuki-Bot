const assert = require('node:assert/strict');
const { test } = require('node:test');
const { ensureUniqueHaremEntries } = require('../database/gachaMigrations');

test('harem migration removes existing duplicates before adding unique indexes', async () => {
    const queries = [];
    const db = {
        run(sql, callback) {
            queries.push(sql.replace(/\s+/g, ' ').trim());
            callback(null);
        }
    };

    await ensureUniqueHaremEntries(db);

    assert.equal(queries.length, 4);
    assert.match(queries[0], /DELETE FROM harem/);
    assert.match(queries[0], /GROUP BY owner_jid, character_name, series/);
    assert.match(queries[1], /CREATE UNIQUE INDEX IF NOT EXISTS harem_owner_character_unique/);
    assert.match(queries[2], /DELETE FROM user_harem/);
    assert.match(queries[2], /GROUP BY user_jid, character_id/);
    assert.match(queries[3], /CREATE UNIQUE INDEX IF NOT EXISTS user_harem_owner_character_unique/);
});
