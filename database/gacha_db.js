const db = require('./db');
const roster = require('../utils/gachaRoster');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS characters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        serie TEXT,
        price INTEGER DEFAULT 1000,
        image_url TEXT,
        is_curated INTEGER DEFAULT 0
    )`);

    // Harem / personajes reclamados por los usuarios
    db.run(`CREATE TABLE IF NOT EXISTS user_harem (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_jid TEXT,
        character_id INTEGER,
        FOREIGN KEY(character_id) REFERENCES characters(id)
    )`);

    // Personajes en venta en la tienda de waifus (.wshop)
    db.run(`CREATE TABLE IF NOT EXISTS waifu_market (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        seller_jid TEXT,
        character_id INTEGER,
        price INTEGER,
        FOREIGN KEY(character_id) REFERENCES characters(id)
    )`);

    const seedRoster = () => {
        let index = 0;
        const seedNext = () => {
            if (index >= roster.length) return;
            const { name, serie, imageUrl } = roster[index++];
            const configuredImageUrl = typeof imageUrl === 'string' && imageUrl.trim()
                ? imageUrl.trim()
                : null;
            db.run(
                `INSERT INTO characters (name, serie, price, image_url, is_curated)
                 SELECT ?, ?, 1000, ?, 1
                 WHERE NOT EXISTS (
                     SELECT 1 FROM characters WHERE name = ? AND serie = ?
                 )`,
                [name, serie, configuredImageUrl, name, serie],
                insertErr => {
                    if (insertErr) console.error(`Error al registrar ${name} en el catálogo gacha:`, insertErr.message);
                    db.run(
                        `UPDATE characters
                         SET is_curated = 1, image_url = ?
                         WHERE name = ? AND serie = ?`,
                        [configuredImageUrl, name, serie],
                        updateErr => {
                            if (updateErr) console.error(`Error al marcar ${name} como personaje del catálogo:`, updateErr.message);
                            seedNext();
                        }
                    );
                }
            );
        };
        seedNext();
    };

    if (db.isNeon) {
        seedRoster();
    } else {
        db.all(`PRAGMA table_info(characters)`, [], (err, columns) => {
            if (err) {
                console.error('Error al revisar el catálogo gacha:', err.message);
                return;
            }
            if (columns.some(column => column.name === 'is_curated')) {
                seedRoster();
                return;
            }
            db.run(`ALTER TABLE characters ADD COLUMN is_curated INTEGER DEFAULT 0`, alterErr => {
                if (alterErr) {
                    console.error('Error al actualizar el esquema del catálogo gacha:', alterErr.message);
                    return;
                }
                seedRoster();
            });
        });
    }
});