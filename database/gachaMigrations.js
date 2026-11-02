function run(db, sql) {
    return new Promise((resolve, reject) => {
        db.run(sql, error => error ? reject(error) : resolve());
    });
}

async function ensureUniqueHaremEntries(db) {
    await run(db, `
        DELETE FROM harem
        WHERE id NOT IN (
            SELECT MIN(id)
            FROM harem
            GROUP BY owner_jid, character_name, series
        )
    `);
    await run(db, `
        CREATE UNIQUE INDEX IF NOT EXISTS harem_owner_character_unique
        ON harem (owner_jid, character_name, series)
    `);
    await run(db, `
        DELETE FROM user_harem
        WHERE id NOT IN (
            SELECT MIN(id)
            FROM user_harem
            GROUP BY user_jid, character_id
        )
    `);
    await run(db, `
        CREATE UNIQUE INDEX IF NOT EXISTS user_harem_owner_character_unique
        ON user_harem (user_jid, character_id)
    `);
}

module.exports = { ensureUniqueHaremEntries };
