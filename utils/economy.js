// utils/economy.js
// Operaciones de dinero y XP compartidas por los comandos nuevos de economía.
// Todo usa SQL válido en SQLite y en PostgreSQL (Neon) y evita que la billetera quede en negativo.
const db = require('../database/db');
const { run, get, all } = require('./dbp');

/** Crea la cuenta si no existe y devuelve su fila. */
function ensureUser(jid) {
    return new Promise((resolve, reject) => {
        db.getSafeUser(jid, (error, user) => (error ? reject(error) : resolve(user || {})));
    });
}

function money(amount) {
    return `$${Number(amount || 0).toLocaleString('es-CO')}`;
}

async function getWallet(jid) {
    const user = await ensureUser(jid);
    return Math.max(0, Number(user.wallet) || 0);
}

async function netWorth(jid) {
    const user = await ensureUser(jid);
    return Math.max(0, Number(user.wallet) || 0) + Math.max(0, Number(user.bank) || 0);
}

/** Suma dinero a la billetera. */
async function credit(jid, amount) {
    const value = Math.max(0, Math.floor(Number(amount) || 0));
    await ensureUser(jid);
    if (value === 0) return;
    await run('UPDATE users SET wallet = COALESCE(wallet, 0) + ? WHERE jid = ?', [value, jid]);
}

/**
 * Resta como máximo `wanted` y nunca más de lo que hay en la billetera.
 * @returns {Promise<number>} lo que realmente se descontó
 */
async function debitUpTo(jid, wanted) {
    const user = await ensureUser(jid);
    const wallet = Math.max(0, Number(user.wallet) || 0);
    const take = Math.min(Math.max(0, Math.floor(Number(wanted) || 0)), wallet);
    if (take <= 0) return 0;
    const result = await run('UPDATE users SET wallet = wallet - ? WHERE jid = ? AND wallet >= ?', [take, jid, take]);
    return result.changes > 0 ? take : 0;
}

/** Resta exactamente `amount` o no hace nada. @returns {Promise<boolean>} */
async function debit(jid, amount) {
    const value = Math.floor(Number(amount) || 0);
    if (value <= 0) return true;
    await ensureUser(jid);
    const result = await run('UPDATE users SET wallet = wallet - ? WHERE jid = ? AND wallet >= ?', [value, jid, value]);
    return result.changes > 0;
}

/** Suma XP y recalcula el nivel igual que el contador de mensajes (500 XP por nivel). */
async function addExp(jid, amount) {
    const value = Math.max(0, Math.floor(Number(amount) || 0));
    await ensureUser(jid);
    if (value === 0) return;
    await run(
        'UPDATE users SET exp = COALESCE(exp, 0) + ?, level = CAST((COALESCE(exp, 0) + ?) / 500 AS INTEGER) + 1 WHERE jid = ?',
        [value, value, jid]
    );
}

function rollBetween(min, max, rng = Math.random) {
    return min + Math.floor(rng() * (max - min + 1));
}

function pickFrom(list, rng = Math.random) {
    return list[Math.floor(rng() * list.length)];
}

module.exports = {
    ensureUser, money, getWallet, netWorth, credit, debit, debitUpTo, addExp, rollBetween, pickFrom,
    run, get, all
};
