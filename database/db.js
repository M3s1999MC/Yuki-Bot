if (process.env.DATABASE_URL) {
    module.exports = require('./neonDb');
} else {
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbDir = process.env.YUKI_DATA_DIR
    ? path.resolve(process.env.YUKI_DATA_DIR)
    : __dirname;
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'yuki.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error al conectar con la base de datos SQLite:', err.message);
    } else {
        console.log('✅ Conectado a la base de datos SQLite con éxito.');
    }
});

const userColumns = {
    name: 'TEXT',
    exp: 'INTEGER DEFAULT 0',
    level: 'INTEGER DEFAULT 1',
    balance: 'INTEGER DEFAULT 0',
    coins: 'INTEGER DEFAULT 0',
    wallet: 'INTEGER DEFAULT 0',
    bank: 'INTEGER DEFAULT 0',
    married: "TEXT DEFAULT 'Nadie 💔'",
    birthday: "TEXT DEFAULT 'No registrado'",
    hobby: "TEXT DEFAULT 'Sin asignar'",
    gender: "TEXT DEFAULT 'Sin asignar'",
    bio: "TEXT DEFAULT 'Sin asignar'",
    main_waifu: 'TEXT',
    claim_message: 'TEXT',
    afk_reason: 'TEXT',
    afk_since: 'INTEGER',
    profile_image: 'TEXT',
    tickets: 'INTEGER DEFAULT 0',
    lastDaily: 'INTEGER DEFAULT 0',
    lastWeekly: 'INTEGER DEFAULT 0',
    lastMonthly: 'INTEGER DEFAULT 0'
};

function ensureColumns(table, columns) {
    db.all(`PRAGMA table_info(${table})`, [], (err, rows) => {
        if (err) {
            console.error(`Error al leer el esquema de ${table}:`, err.message);
            return;
        }

        const existing = new Set(rows.map(row => row.name));
        for (const [column, definition] of Object.entries(columns)) {
            if (existing.has(column)) continue;
            db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`, (alterErr) => {
                if (alterErr) console.error(`Error al agregar ${table}.${column}:`, alterErr.message);
                else if (table === 'message_counts' && column === 'last_message_at') {
                    db.run(`UPDATE message_counts SET last_message_at = ? WHERE last_message_at = 0`, [Date.now()], (backfillErr) => {
                        if (backfillErr) console.error('Error al inicializar fechas de actividad del grupo:', backfillErr.message);
                    });
                }
            });
        }
    });
}

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        jid TEXT UNIQUE,
        name TEXT,
        exp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        balance INTEGER DEFAULT 0,
        coins INTEGER DEFAULT 0,
        wallet INTEGER DEFAULT 0,
        bank INTEGER DEFAULT 0,
        married TEXT DEFAULT 'Nadie 💔',
        birthday TEXT DEFAULT 'No registrado',
        hobby TEXT DEFAULT 'Sin asignar',
        gender TEXT DEFAULT 'Sin asignar',
        bio TEXT DEFAULT 'Sin asignar',
        main_waifu TEXT,
        claim_message TEXT,
        afk_reason TEXT,
        afk_since INTEGER,
        profile_image TEXT,
        tickets INTEGER DEFAULT 0,
        lastDaily INTEGER DEFAULT 0,
        lastWeekly INTEGER DEFAULT 0,
        lastMonthly INTEGER DEFAULT 0
    )`, (err) => {
        if (err) console.error('Error al crear users:', err.message);
        else ensureColumns('users', userColumns);
    });

    db.run(`CREATE TABLE IF NOT EXISTS wa_contacts (
        jid TEXT PRIMARY KEY,
        name TEXT NOT NULL
    )`, (err) => {
        if (err) console.error('Error al crear wa_contacts:', err.message);
    });

    db.run(`CREATE TABLE IF NOT EXISTS harem (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_jid TEXT,
        character_name TEXT,
        series TEXT,
        image_url TEXT,
        value INTEGER
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS market (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        seller_jid TEXT,
        character_name TEXT,
        series TEXT,
        image_url TEXT,
        price INTEGER
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS saved_phrases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_jid TEXT,
        phrase TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS warnings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_jid TEXT,
        user_jid TEXT,
        reason TEXT DEFAULT 'Sin razón especificada'
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS group_settings (
        group_jid TEXT PRIMARY KEY,
        warn_limit INTEGER DEFAULT 3,
        welcome_enabled INTEGER DEFAULT 0,
        welcome_text TEXT DEFAULT '¡Bienvenid@ al grupo! 🌸',
        welcome_image TEXT,
        goodbye_enabled INTEGER DEFAULT 0,
        goodbye_text TEXT DEFAULT 'Hasta luego... 👋',
        antilink INTEGER DEFAULT 0,
        admin_only INTEGER DEFAULT 0,
        bot_active INTEGER DEFAULT 1,
        primary_bot_jid TEXT
    )`, (err) => {
        if (err) console.error('Error al crear group_settings:', err.message);
        else ensureColumns('group_settings', {
            warn_limit: 'INTEGER DEFAULT 3',
            welcome_enabled: 'INTEGER DEFAULT 0',
            welcome_text: "TEXT DEFAULT '¡Bienvenid@ al grupo! 🌸'",
            welcome_image: 'TEXT',
            goodbye_enabled: 'INTEGER DEFAULT 0',
            goodbye_text: "TEXT DEFAULT 'Hasta luego... 👋'",
            antilink: 'INTEGER DEFAULT 0',
            admin_only: 'INTEGER DEFAULT 0',
            bot_active: 'INTEGER DEFAULT 1',
            primary_bot_jid: 'TEXT'
        });
    });
    db.run(`CREATE TABLE IF NOT EXISTS message_counts (
        group_jid TEXT,
        user_jid TEXT,
        count INTEGER DEFAULT 0,
        last_message_at INTEGER DEFAULT 0,
        PRIMARY KEY (group_jid, user_jid)
    )`, (err) => {
        if (err) console.error('Error al crear message_counts:', err.message);
        else ensureColumns('message_counts', { last_message_at: 'INTEGER DEFAULT 0' });
    });
    db.run(`CREATE TABLE IF NOT EXISTS gacha_votes (
        group_jid TEXT,
        user_jid TEXT,
        character_name TEXT,
        PRIMARY KEY (group_jid, user_jid, character_name)
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS user_minerals (
        user_jid TEXT,
        mineral TEXT,
        quantity INTEGER DEFAULT 0,
        PRIMARY KEY (user_jid, mineral)
    )`);

    console.log('📦 Todas las tablas del sistema de Yuki se han verificado/creado correctamente.');
});

// Función para registrar usuarios instantáneamente al escribir
db.registerUser = function(jid, name = 'Usuario', callback) {
    if (!jid) return;
    const displayName = typeof name === 'string' ? name.trim() : '';
    const hasDisplayName = Boolean(displayName) && displayName !== 'Usuario';
    const storedName = hasDisplayName ? displayName : 'Usuario';

    this.run(
        `INSERT INTO users (jid, name) VALUES (?, ?)
         ON CONFLICT(jid) DO UPDATE SET name = CASE
             WHEN users.name IS NULL OR TRIM(users.name) = '' OR users.name = 'Usuario'
                  OR users.name NOT GLOB '*[^0-9+ ]*' THEN excluded.name
             ELSE users.name
         END`,
        [jid, storedName],
        (err) => {
            if (err) {
                console.error('Error al registrar usuario:', err.message);
                if (callback) callback(err);
                return;
            }
            if (callback) callback(null);
        }
    );
};

db.updateContactName = function(contact, callback) {
    const name = [contact?.name, contact?.notify, contact?.verifiedName]
        .find(value => typeof value === 'string' && value.trim() && value.trim() !== 'Usuario');
    const jids = [...new Set([contact?.id, contact?.lid, contact?.phoneNumber]
        .filter(value => typeof value === 'string' && value.trim())
        .map(value => value.includes('@') ? value : `${value}@s.whatsapp.net`))];

    if (!name || jids.length === 0) {
        if (callback) callback(null);
        return;
    }

    this.serialize(() => {
        for (const jid of jids) {
            this.run(
                `INSERT INTO wa_contacts (jid, name) VALUES (?, ?)
                 ON CONFLICT(jid) DO UPDATE SET name = excluded.name`,
                [jid, name.trim()],
                (err) => {
                    if (err) console.error('Error al guardar contacto de WhatsApp:', err.message);
                }
            );
        }

        const placeholders = jids.map(() => '?').join(', ');
        this.run(
            `UPDATE users SET name = ? WHERE jid IN (${placeholders})`,
            [name.trim(), ...jids],
            (err) => {
            if (err) console.error('Error al actualizar nombre desde contactos de WhatsApp:', err.message);
            if (callback) callback(err || null);
            }
        );
    });
};

db.getContactNames = function(callback) {
    this.all('SELECT DISTINCT name FROM wa_contacts', [], (err, rows) => {
        if (err) {
            console.error('Error al consultar nombres de contactos de WhatsApp:', err.message);
            callback(err);
            return;
        }
        callback(null, rows.map(row => row.name));
    });
};

db.getSafeUser = function(jid, callback) {
    if (!jid) {
        callback(new Error('Se requiere un JID para consultar el usuario'));
        return;
    }

    this.run(`INSERT OR IGNORE INTO users (jid, name) VALUES (?, ?)`, [jid, jid.split('@')[0]], (insertErr) => {
        if (insertErr) return callback(insertErr);
        this.get(`SELECT * FROM users WHERE jid = ?`, [jid], callback);
    });
};

db.getSafeGroup = function(jid, callback) {
    if (!jid) {
        callback(new Error('Se requiere un JID para consultar el grupo'));
        return;
    }

    this.run(`INSERT OR IGNORE INTO group_settings (group_jid) VALUES (?)`, [jid], (insertErr) => {
        if (insertErr) return callback(insertErr);
        this.get(`SELECT * FROM group_settings WHERE group_jid = ?`, [jid], callback);
    });
};

module.exports = db;
}
