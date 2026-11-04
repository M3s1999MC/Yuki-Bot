const { AsyncLocalStorage } = require('async_hooks');
const { Pool, types } = require('pg');

types.setTypeParser(20, value => Number(value));
types.setTypeParser(1700, value => Number(value));

const schema = [
    `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        jid TEXT UNIQUE,
        name TEXT,
        exp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        coins INTEGER DEFAULT 0,
        wallet INTEGER DEFAULT 0,
        bank INTEGER DEFAULT 0,
        balance INTEGER DEFAULT 0,
        married TEXT DEFAULT 'Nadie 💔',
        birthday TEXT DEFAULT 'No registrado',
        hobby TEXT DEFAULT 'Sin asignar',
        gender TEXT DEFAULT 'Sin asignar',
        bio TEXT DEFAULT 'Sin asignar',
        main_waifu TEXT,
        claim_message TEXT,
        afk_reason TEXT,
        afk_since BIGINT,
        profile_image TEXT,
        tickets INTEGER DEFAULT 0,
        lastdaily BIGINT DEFAULT 0,
        lastweekly BIGINT DEFAULT 0,
        lastmonthly BIGINT DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS wa_contacts (jid TEXT PRIMARY KEY, name TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS harem (
        id SERIAL PRIMARY KEY, owner_jid TEXT, character_name TEXT, series TEXT,
        image_url TEXT, value INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS market (
        id SERIAL PRIMARY KEY, seller_jid TEXT, character_name TEXT, series TEXT,
        image_url TEXT, price INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS saved_phrases (
        id SERIAL PRIMARY KEY, user_jid TEXT, phrase TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS warnings (
        id SERIAL PRIMARY KEY, group_jid TEXT, user_jid TEXT,
        reason TEXT DEFAULT 'Sin razón especificada'
    )`,
    `CREATE TABLE IF NOT EXISTS group_settings (
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
    )`,
    `CREATE TABLE IF NOT EXISTS message_counts (
        group_jid TEXT, user_jid TEXT, count INTEGER DEFAULT 0,
        last_message_at BIGINT DEFAULT 0, PRIMARY KEY (group_jid, user_jid)
    )`,
    `CREATE TABLE IF NOT EXISTS gacha_votes (
        group_jid TEXT, user_jid TEXT, character_name TEXT,
        PRIMARY KEY (group_jid, user_jid, character_name)
    )`,
    `CREATE TABLE IF NOT EXISTS user_minerals (
        user_jid TEXT, mineral TEXT, quantity INTEGER DEFAULT 0,
        PRIMARY KEY (user_jid, mineral)
    )`,
    `CREATE TABLE IF NOT EXISTS inventory (
        user_jid TEXT, ore_name TEXT, quantity INTEGER,
        PRIMARY KEY (user_jid, ore_name)
    )`,
    `CREATE TABLE IF NOT EXISTS characters (
        id SERIAL PRIMARY KEY, name TEXT, serie TEXT,
        price INTEGER DEFAULT 1000, image_url TEXT, is_curated INTEGER DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS user_harem (
        id SERIAL PRIMARY KEY, user_jid TEXT, character_id INTEGER REFERENCES characters(id)
    )`,
    `CREATE TABLE IF NOT EXISTS waifu_market (
        id SERIAL PRIMARY KEY, seller_jid TEXT, character_id INTEGER REFERENCES characters(id),
        price INTEGER
    )`
];

function translateSql(source) {
    let sql = source.trim();
    const ignoreConflicts = /^\s*INSERT\s+OR\s+IGNORE\s+/i.test(sql);
    sql = sql.replace(/^\s*INSERT\s+OR\s+IGNORE\s+/i, 'INSERT ');
    sql = sql.replace(/\bBEGIN\s+(?:IMMEDIATE|EXCLUSIVE|TRANSACTION)\b/ig, 'BEGIN');
    sql = sql.replace(/\bALTER\s+TABLE\s+(\S+)\s+ADD\s+COLUMN\s+/ig, 'ALTER TABLE $1 ADD COLUMN IF NOT EXISTS ');
    sql = sql.replace(/\b([a-z_]\w*)\s+INTEGER\s+PRIMARY\s+KEY\s+AUTOINCREMENT\b/ig, '$1 SERIAL PRIMARY KEY');
    sql = sql.replace(/users\.name\s+NOT\s+GLOB\s+'\*\[\^0-9\+ \]\*'/ig, "users.name !~ '[^0-9+ ]'");
    sql = sql.replace(/\bLIKE\s+(\?)\s+COLLATE\s+NOCASE/ig, 'ILIKE $1');
    sql = sql.replace(/([a-z_][\w.]*)\s+COLLATE\s+NOCASE/ig, 'LOWER($1)');

    let parameterIndex = 0;
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let output = '';
    for (let index = 0; index < sql.length; index += 1) {
        const character = sql[index];
        if (character === "'" && !inDoubleQuote) {
            output += character;
            if (inSingleQuote && sql[index + 1] === "'") {
                output += sql[index + 1];
                index += 1;
            } else {
                inSingleQuote = !inSingleQuote;
            }
            continue;
        }
        if (character === '"' && !inSingleQuote) {
            output += character;
            if (inDoubleQuote && sql[index + 1] === '"') {
                output += sql[index + 1];
                index += 1;
            } else {
                inDoubleQuote = !inDoubleQuote;
            }
            continue;
        }
        if (character === '?' && !inSingleQuote && !inDoubleQuote) {
            parameterIndex += 1;
            output += `$${parameterIndex}`;
        } else {
            output += character;
        }
    }

    if (ignoreConflicts && !/\bON\s+CONFLICT\b/i.test(output)) {
        output = `${output.replace(/;\s*$/, '')} ON CONFLICT DO NOTHING`;
    }
    return output;
}

function createNeonDatabase(pool) {
    const transactions = new AsyncLocalStorage();
    let transactionQueue = Promise.resolve();

    const ready = schema.reduce(
        (previous, statement) => previous.then(() => pool.query(statement)),
        Promise.resolve()
    ).then(async () => {
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS balance INTEGER DEFAULT 0`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS hobby TEXT DEFAULT 'Sin asignar'`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT 'Sin asignar'`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS lastdaily BIGINT DEFAULT 0`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS lastweekly BIGINT DEFAULT 0`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS lastmonthly BIGINT DEFAULT 0`);
        await pool.query(`ALTER TABLE users ALTER COLUMN afk_since TYPE BIGINT`);
        await pool.query(`ALTER TABLE users ALTER COLUMN lastdaily TYPE BIGINT`);
        await pool.query(`ALTER TABLE users ALTER COLUMN lastweekly TYPE BIGINT`);
        await pool.query(`ALTER TABLE users ALTER COLUMN lastmonthly TYPE BIGINT`);
        await pool.query(`ALTER TABLE message_counts ALTER COLUMN last_message_at TYPE BIGINT`);
        await pool.query(`ALTER TABLE characters ADD COLUMN IF NOT EXISTS is_curated INTEGER DEFAULT 0`);
    });

    function acquireTransactionLock() {
        const previous = transactionQueue;
        let release;
        transactionQueue = new Promise(resolve => {
            release = resolve;
        });
        return previous.then(() => release);
    }

    function normalizeArgs(params, callback) {
        if (typeof params === 'function') return { params: [], callback: params };
        return { params: Array.isArray(params) ? params : [], callback };
    }

    function invokeCallback(callback, context, args, callbackThis) {
        if (typeof callback !== 'function') return;
        const invoke = () => callback.apply(callbackThis, args);
        if (context) {
            transactions.run(context, invoke);
        } else {
            invoke();
        }
    }

    function execute(sql, params, callback, mode) {
        const context = transactions.getStore();
        const normalizedSql = translateSql(sql);
        const isBegin = /^\s*BEGIN\b/i.test(normalizedSql);
        const isFinish = /^\s*(?:COMMIT|ROLLBACK)\b/i.test(normalizedSql);
        let transactionContext = context;

        if (isBegin) {
            transactionContext = context || { client: null, releaseLock: null, beginPromise: null };
            if (!transactionContext.beginPromise) {
                transactionContext.beginPromise = ready.then(async () => {
                    transactionContext.releaseLock = await acquireTransactionLock();
                    try {
                        transactionContext.client = await pool.connect();
                        await transactionContext.client.query('BEGIN');
                    } catch (error) {
                        transactionContext.releaseLock();
                        transactionContext.releaseLock = null;
                        if (transactionContext.client) transactionContext.client.release();
                        transactionContext.client = null;
                        throw error;
                    }
                });
            }
        }

        const operation = ready.then(async () => {
            if (transactionContext?.beginPromise) await transactionContext.beginPromise;
            if (isBegin) return { rows: [], rowCount: 0 };
            const client = transactionContext?.client;
            const result = client
                ? await client.query(normalizedSql, params)
                : await pool.query(normalizedSql, params);

            if (isFinish && transactionContext?.client) {
                transactionContext.client.release();
                transactionContext.client = null;
                transactionContext.beginPromise = null;
                transactionContext.releaseLock?.();
                transactionContext.releaseLock = null;
            }
            return result;
        });

        operation.then(result => {
            if (mode === 'run') {
                const resultContext = { changes: result.rowCount || 0 };
                invokeCallback(callback, transactionContext, [null], resultContext);
                return;
            }
            if (mode === 'get') {
                invokeCallback(callback, transactionContext, [null, normalizeRow(result.rows[0])]);
                return;
            }
            if (mode === 'all') {
                invokeCallback(callback, transactionContext, [null, result.rows.map(normalizeRow)]);
            }
        }).catch(error => {
            if (typeof callback === 'function') {
                invokeCallback(callback, transactionContext, [error]);
            } else {
                console.error('Error en PostgreSQL:', error.message);
            }
        });
    }

    function normalizeRow(row) {
        if (!row) return row;
        const normalized = { ...row };
        for (const [lower, original] of [
            ['lastdaily', 'lastDaily'],
            ['lastweekly', 'lastWeekly'],
            ['lastmonthly', 'lastMonthly']
        ]) {
            if (Object.hasOwn(normalized, lower)) {
                normalized[original] = normalized[lower];
            }
        }
        return normalized;
    }

    const db = {
        isNeon: true,
        pool,
        ready,
        serialize(callback) {
            const context = transactions.getStore() || {
                client: null,
                releaseLock: null,
                beginPromise: null
            };
            transactions.run(context, callback);
            return this;
        },
        run(sql, params, callback) {
            const args = normalizeArgs(params, callback);
            execute(sql, args.params, args.callback, 'run');
            return this;
        },
        recordMessageActivity(jid, name = 'Usuario', options = {}, callback) {
            if (!jid) return;
            const displayName = typeof name === 'string' ? name.trim() : '';
            const storedName = displayName && displayName !== 'Usuario' ? displayName : 'Usuario';
            const experience = options.incrementExp ? 1 : 0;
            const clearAfk = options.clearAfk ? 1 : 0;

            this.run(
                `INSERT INTO users (jid, name, exp, level) VALUES (?, ?, ?, CAST(? / 500 AS INTEGER) + 1)
                 ON CONFLICT(jid) DO UPDATE SET
                     name = CASE
                         WHEN users.name IS NULL OR TRIM(users.name) = '' OR users.name = 'Usuario'
                              OR users.name !~ '[^0-9+ ]' THEN excluded.name
                         ELSE users.name
                     END,
                     exp = users.exp + excluded.exp,
                     level = CAST((users.exp + excluded.exp) / 500 AS INTEGER) + 1,
                     afk_reason = CASE WHEN ? = 1 THEN NULL ELSE users.afk_reason END,
                     afk_since = CASE WHEN ? = 1 THEN NULL ELSE users.afk_since END`,
                [jid, storedName, experience, experience, clearAfk, clearAfk],
                callback
            );
        },
        get(sql, params, callback) {
            const args = normalizeArgs(params, callback);
            execute(sql, args.params, args.callback, 'get');
            return this;
        },
        all(sql, params, callback) {
            const args = normalizeArgs(params, callback);
            execute(sql, args.params, args.callback, 'all');
            return this;
        },
        prepare(sql) {
            return {
                run(params, callback) {
                    if (typeof params === 'function') {
                        db.run(sql, [], params);
                    } else {
                        db.run(sql, params);
                    }
                    return this;
                },
                finalize(callback) {
                    if (callback) callback(null);
                }
            };
        },
        close(callback) {
            pool.end().then(
                () => callback?.(null),
                error => callback?.(error)
            );
        }
    };

    return db;
}

let db = {};
if (process.env.DATABASE_URL) {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: true },
        max: 10,
        connectionTimeoutMillis: 10000
    });
    db = createNeonDatabase(pool);
}

if (process.env.DATABASE_URL) db.registerUser = function(jid, name = 'Usuario', callback) {
    if (!jid) return;
    const displayName = typeof name === 'string' ? name.trim() : '';
    const storedName = displayName && displayName !== 'Usuario' ? displayName : 'Usuario';
    this.run(
        `INSERT INTO users (jid, name) VALUES (?, ?)
         ON CONFLICT(jid) DO UPDATE SET name = CASE
             WHEN users.name IS NULL OR TRIM(users.name) = '' OR users.name = 'Usuario'
                  OR users.name !~ '[^0-9+ ]' THEN excluded.name
             ELSE users.name
         END`,
        [jid, storedName],
        callback
    );
};

if (process.env.DATABASE_URL) db.updateContactName = function(contact, callback) {
    const name = [contact?.name, contact?.notify, contact?.verifiedName]
        .find(value => typeof value === 'string' && value.trim() && value.trim() !== 'Usuario');
    const jids = [...new Set([contact?.id, contact?.lid, contact?.phoneNumber]
        .filter(value => typeof value === 'string' && value.trim())
        .map(value => value.includes('@') ? value : `${value}@s.whatsapp.net`))];
    if (!name || jids.length === 0) {
        callback?.(null);
        return;
    }

    let pending = jids.length + 1;
    let firstError = null;
    const done = error => {
        firstError ||= error;
        pending -= 1;
        if (pending === 0) callback?.(firstError);
    };
    for (const jid of jids) {
        this.run(
            `INSERT INTO wa_contacts (jid, name) VALUES (?, ?)
             ON CONFLICT(jid) DO UPDATE SET name = excluded.name`,
            [jid, name.trim()],
            done
        );
    }
    this.run(
        `UPDATE users SET name = ? WHERE jid IN (${jids.map(() => '?').join(', ')})`,
        [name.trim(), ...jids],
        done
    );
};

if (process.env.DATABASE_URL) db.getContactNames = function(callback) {
    this.all('SELECT DISTINCT name FROM wa_contacts', [], (error, rows) => {
        if (error) return callback(error);
        callback(null, rows.map(row => row.name));
    });
};

if (process.env.DATABASE_URL) db.getSafeUser = function(jid, callback) {
    if (!jid) return callback(new Error('Se requiere un JID para consultar el usuario'));
    this.run(`INSERT INTO users (jid, name) VALUES (?, ?) ON CONFLICT DO NOTHING`, [jid, jid.split('@')[0]], error => {
        if (error) return callback(error);
        this.get('SELECT * FROM users WHERE jid = ?', [jid], callback);
    });
};

if (process.env.DATABASE_URL) db.getSafeGroup = function(jid, callback) {
    if (!jid) return callback(new Error('Se requiere un JID para consultar el grupo'));
    this.run('INSERT INTO group_settings (group_jid) VALUES (?) ON CONFLICT DO NOTHING', [jid], error => {
        if (error) return callback(error);
        this.get('SELECT * FROM group_settings WHERE group_jid = ?', [jid], callback);
    });
};

db.createNeonDatabase = createNeonDatabase;
db.translateSql = translateSql;

module.exports = db;
