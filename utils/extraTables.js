// utils/extraTables.js
// Tablas de los comandos añadidos. Se crean al vuelo con CREATE TABLE IF NOT EXISTS,
// con tipos válidos tanto en SQLite como en PostgreSQL (Neon) y nombres en minúsculas.
const { run } = require('./dbp');

const DDL = [
    `CREATE TABLE IF NOT EXISTS user_cooldowns (
        user_jid TEXT NOT NULL,
        cd_key TEXT NOT NULL,
        until_ts BIGINT NOT NULL,
        PRIMARY KEY (user_jid, cd_key)
    )`,
    `CREATE TABLE IF NOT EXISTS command_stats (
        command TEXT PRIMARY KEY,
        uses BIGINT NOT NULL DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS user_businesses (
        user_jid TEXT NOT NULL,
        business_id TEXT NOT NULL,
        bought_at BIGINT NOT NULL,
        last_collect BIGINT NOT NULL,
        paid_until BIGINT NOT NULL,
        PRIMARY KEY (user_jid, business_id)
    )`,
    `CREATE TABLE IF NOT EXISTS bot_bans (
        group_jid TEXT NOT NULL,
        user_jid TEXT NOT NULL,
        PRIMARY KEY (group_jid, user_jid)
    )`,
    `CREATE TABLE IF NOT EXISTS group_vetos (
        group_jid TEXT NOT NULL,
        user_jid TEXT NOT NULL,
        PRIMARY KEY (group_jid, user_jid)
    )`,
    `CREATE TABLE IF NOT EXISTS disabled_commands (
        name TEXT PRIMARY KEY
    )`,
    `CREATE TABLE IF NOT EXISTS profile_extra (
        user_jid TEXT PRIMARY KEY,
        game TEXT,
        music TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS eco_missions (
        user_jid TEXT NOT NULL,
        mission_key TEXT NOT NULL,
        day TEXT NOT NULL,
        progress INTEGER NOT NULL DEFAULT 0,
        claimed INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (user_jid, mission_key, day)
    )`
];

let readyPromise = null;

function ensureTables() {
    if (!readyPromise) {
        readyPromise = DDL.reduce((previous, sql) => previous.then(() => run(sql)), Promise.resolve());
        readyPromise.catch(() => { readyPromise = null; });
    }
    return readyPromise;
}

module.exports = { ensureTables, DDL };
