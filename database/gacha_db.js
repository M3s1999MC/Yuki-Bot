const db = require('./db');
const roster = require('../utils/gachaRoster');
const { ensureUniqueHaremEntries } = require('./gachaMigrations');

function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, error => error ? reject(error) : resolve());
    });
}

function all(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (error, rows) => error ? reject(error) : resolve(rows));
    });
}

async function initializeGachaDatabase() {
    if (db.ready) await db.ready;

    await run(`CREATE TABLE IF NOT EXISTS characters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        serie TEXT,
        price INTEGER DEFAULT 1000,
        image_url TEXT,
        is_curated INTEGER DEFAULT 0
    )`);
    await run(`CREATE TABLE IF NOT EXISTS user_harem (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_jid TEXT,
        character_id INTEGER,
        FOREIGN KEY(character_id) REFERENCES characters(id)
    )`);
    await run(`CREATE TABLE IF NOT EXISTS waifu_market (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        seller_jid TEXT,
        character_id INTEGER,
        price INTEGER,
        FOREIGN KEY(character_id) REFERENCES characters(id)
    )`);
    await ensureUniqueHaremEntries(db);

    if (!db.isNeon) {
        const columns = await all(`PRAGMA table_info(characters)`);
        if (!columns.some(column => column.name === 'is_curated')) {
            await run(`ALTER TABLE characters ADD COLUMN is_curated INTEGER DEFAULT 0`);
        }
    }

    for (const { name, serie, imageUrl } of roster) {
        const configuredImageUrl = typeof imageUrl === 'string' && imageUrl.trim()
            ? imageUrl.trim()
            : null;
        await run(
            `INSERT INTO characters (name, serie, price, image_url, is_curated)
             SELECT ?, ?, 1000, ?, 1
             WHERE NOT EXISTS (
                 SELECT 1 FROM characters WHERE name = ? AND serie = ?
             )`,
            [name, serie, configuredImageUrl, name, serie]
        );
        await run(
            `UPDATE characters
             SET is_curated = 1, image_url = ?
             WHERE name = ? AND serie = ?`,
            [configuredImageUrl, name, serie]
        );
    }
}

module.exports = initializeGachaDatabase();
