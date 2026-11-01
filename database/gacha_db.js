const db = require('./db');

db.serialize(() => {
    // Catálogo de series y personajes
    db.run(`CREATE TABLE IF NOT EXISTS characters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        serie TEXT,
        price INTEGER DEFAULT 1000,
        image_url TEXT
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

    // Poblar algunos personajes de prueba si la tabla está vacía
    db.get(`SELECT COUNT(*) as count FROM characters`, [], (err, row) => {
        if (row && row.count === 0) {
            const sampleChars = [
                ['Ichigo', 'Bleach', 2500, 'https://i.pinimg.com/736x/47/60/30/47603071ef09685bf0dc70951f8dc1ee.jpg'],
                ['orihime', 'Bleach', 2000, 'https://i.pinimg.com/1200x/b5/64/2a/b5642af14e577f9668399dd91fd874e5.jpg'],
                ['Satoru Gojo', 'Jujutsu Kaisen', 1800, 'https://i.pinimg.com/1200x/dd/7d/97/dd7d973f3eaa5cc38ffa0af6d6fb23ec.jpg'],
                ['Penny Parker', 'Spider-Man: Across the Spider-Verse', 1500, 'https://i.pinimg.com/736x/16/1a/82/161a82ecbefb94e86401619493815d7e.jpg'],
                ['Maki Zenin', 'Jujutsu Kaisen', 2200, 'https://i.pinimg.com/736x/a8/1c/e3/a81ce31954e67a6f843eceaa477c70dd.jpg']
            ];
            const stmt = db.prepare(`INSERT INTO characters (name, serie, price, image_url) VALUES (?, ?, ?, ?)`);
            sampleChars.forEach(c => stmt.run(c));
            stmt.finalize();
        }
    });
});