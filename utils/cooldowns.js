// utils/cooldowns.js
// Cooldowns por usuario guardados en la base de datos (sobreviven a reinicios).
// claim() es atómico: dos comandos simultáneos no pueden cobrar el mismo cooldown.
const { run, get } = require('./dbp');
const { ensureTables } = require('./extraTables');

/**
 * Intenta reclamar el cooldown. Si estaba libre, lo deja corriendo y devuelve ok.
 * @returns {Promise<{ok: true, until: number} | {ok: false, remainingMs: number}>}
 */
async function claim(userJid, key, ms, now = Date.now()) {
    await ensureTables();
    const until = now + ms;
    const result = await run(
        `INSERT INTO user_cooldowns (user_jid, cd_key, until_ts) VALUES (?, ?, ?)
         ON CONFLICT (user_jid, cd_key) DO UPDATE SET until_ts = excluded.until_ts
         WHERE user_cooldowns.until_ts <= ?`,
        [userJid, key, until, now]
    );
    if (result.changes > 0) return { ok: true, until };
    const row = await get('SELECT until_ts FROM user_cooldowns WHERE user_jid = ? AND cd_key = ?', [userJid, key]);
    return { ok: false, remainingMs: Math.max(0, Number(row?.until_ts || 0) - now) };
}

/** Devuelve los ms que faltan (0 si está libre) sin reclamar nada. */
async function remaining(userJid, key, now = Date.now()) {
    await ensureTables();
    const row = await get('SELECT until_ts FROM user_cooldowns WHERE user_jid = ? AND cd_key = ?', [userJid, key]);
    return Math.max(0, Number(row?.until_ts || 0) - now);
}

/** Libera el cooldown (por ejemplo si la acción falló después de reclamarlo). */
async function release(userJid, key) {
    await ensureTables();
    await run('DELETE FROM user_cooldowns WHERE user_jid = ? AND cd_key = ?', [userJid, key]);
}

function formatDuration(ms) {
    const totalSeconds = Math.max(1, Math.ceil(ms / 1000));
    const h = Math.floor(totalSeconds / 3600);
    const min = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return min > 0 ? `${h} h ${min} min` : `${h} h`;
    if (min > 0) return s > 0 && min < 5 ? `${min} min ${s} s` : `${min} min`;
    return `${s} s`;
}

module.exports = { claim, remaining, release, formatDuration };
