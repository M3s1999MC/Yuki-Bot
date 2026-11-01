const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createNeonDatabase, translateSql } = require('../database/neonDb');

function createFakePool() {
    const queries = [];
    const clientQueries = [];
    const client = {
        async query(sql, params = []) {
            clientQueries.push({ sql, params });
            return { rows: [], rowCount: sql.startsWith('UPDATE') ? 2 : 0 };
        },
        release() {}
    };
    return {
        queries,
        clientQueries,
        async query(sql, params = []) {
            queries.push({ sql, params });
            return { rows: sql.startsWith('SELECT') ? [{ count: 4 }] : [], rowCount: 1 };
        },
        async connect() {
            return client;
        },
        async end() {}
    };
}

test('Neon SQL compatibility converts SQLite placeholders and syntax', () => {
    assert.equal(
        translateSql(`SELECT * FROM harem WHERE owner_jid = ? AND character_name LIKE ? COLLATE NOCASE`),
        `SELECT * FROM harem WHERE owner_jid = $1 AND character_name ILIKE $2`
    );
    assert.equal(
        translateSql(`INSERT OR IGNORE INTO users (jid) VALUES (?)`),
        `INSERT INTO users (jid) VALUES ($1) ON CONFLICT DO NOTHING`
    );
    assert.equal(translateSql('BEGIN IMMEDIATE'), 'BEGIN');
    assert.equal(
        translateSql(`ALTER TABLE users ADD COLUMN lastWeekly INTEGER DEFAULT 0`),
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS lastWeekly INTEGER DEFAULT 0`
    );
    assert.match(
        translateSql(`UPDATE users SET name = excluded.name WHERE users.name NOT GLOB '*[^0-9+ ]*'`),
        /users\.name !~ '\[\^0-9\+ \]'/
    );
});

test('Neon database adapter preserves callback results and transaction boundaries', async () => {
    const pool = createFakePool();
    const db = createNeonDatabase(pool);
    await db.ready;

    const count = await new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) AS count FROM users WHERE jid = ?', ['user'], (error, row) => {
            if (error) reject(error);
            else resolve(row.count);
        });
    });
    assert.equal(count, 4);
    assert.equal(pool.queries.at(-1).sql, 'SELECT COUNT(*) AS count FROM users WHERE jid = $1');

    await new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            db.run('UPDATE users SET coins = coins + ? WHERE jid = ?', [10, 'user'], function(error) {
                if (error) return reject(error);
                assert.equal(this.changes, 2);
                db.run('COMMIT', commitError => commitError ? reject(commitError) : resolve());
            });
        });
    });
    assert.deepEqual(
        pool.clientQueries.map(query => query.sql),
        ['BEGIN', 'UPDATE users SET coins = coins + $1 WHERE jid = $2', 'COMMIT']
    );
});
