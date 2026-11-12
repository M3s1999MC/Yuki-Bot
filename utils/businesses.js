// utils/businesses.js
// Sistema de negocios: se compran una vez, generan ganancias por hora (acumulan hasta 24 h)
// y requieren pagar mantenimiento semanal; sin mantenimiento dejan de producir.
const economy = require('./economy');
const { ensureTables } = require('./extraTables');

const HOUR = 3600000;
const WEEK = 7 * 24 * HOUR;
const MAX_STORED = 24 * HOUR;       // lo máximo que acumula un negocio sin cobrar
const MAX_PREPAID = 21 * 24 * HOUR; // no se puede adelantar más de 4 semanas en total

const BUSINESSES = [
    { id: 'arepas', num: 1, emoji: '🫓', name: 'Puesto de arepas', price: 5000, perHour: 150 },
    { id: 'tienda', num: 2, emoji: '🏪', name: 'Tienda de barrio', price: 20000, perHour: 650 },
    { id: 'cafe', num: 3, emoji: '☕', name: 'Cafetería', price: 60000, perHour: 2000 },
    { id: 'gimnasio', num: 4, emoji: '🏋️', name: 'Gimnasio', price: 150000, perHour: 5200 },
    { id: 'restaurante', num: 5, emoji: '🍽️', name: 'Restaurante', price: 400000, perHour: 14000 },
    { id: 'hotel', num: 6, emoji: '🏨', name: 'Hotel', price: 1500000, perHour: 55000 }
].map(item => ({ ...item, upkeep: Math.round(item.price * 0.1) }));

function findBusiness(query) {
    const text = String(query || '').trim().toLowerCase();
    if (!text) return null;
    return BUSINESSES.find(item => String(item.num) === text || item.id === text || item.name.toLowerCase() === text) || null;
}

/** Ganancia acumulada de un negocio: horas completas desde el último cobro (máx. 24 h) hasta que vence el mantenimiento. */
function pendingIncome(business, row, now = Date.now()) {
    const end = Math.min(now, Number(row.paid_until));
    const span = Math.min(Math.max(0, end - Number(row.last_collect)), MAX_STORED);
    return Math.floor((span / HOUR) * business.perHour);
}

async function listOwned(jid) {
    await ensureTables();
    const rows = await economy.all('SELECT business_id, bought_at, last_collect, paid_until FROM user_businesses WHERE user_jid = ?', [jid]);
    return rows
        .map(row => ({ row, business: BUSINESSES.find(item => item.id === row.business_id) }))
        .filter(item => item.business)
        .sort((a, b) => a.business.num - b.business.num);
}

async function buy(jid, business, now = Date.now()) {
    await ensureTables();
    await economy.ensureUser(jid);
    const owned = await economy.get('SELECT business_id FROM user_businesses WHERE user_jid = ? AND business_id = ?', [jid, business.id]);
    if (owned) return { ok: false, reason: 'owned' };
    if (!(await economy.debit(jid, business.price))) return { ok: false, reason: 'funds' };
    try {
        await economy.run(
            'INSERT INTO user_businesses (user_jid, business_id, bought_at, last_collect, paid_until) VALUES (?, ?, ?, ?, ?)',
            [jid, business.id, now, now, now + WEEK]
        );
    } catch (error) {
        await economy.credit(jid, business.price); // compra simultánea: devolvemos el dinero
        return { ok: false, reason: 'owned' };
    }
    return { ok: true };
}

/** Cobra las ganancias de todos los negocios. Cada fila se reclama con una condición para no cobrar dos veces. */
async function collectAll(jid, now = Date.now()) {
    const owned = await listOwned(jid);
    let total = 0;
    const details = [];
    for (const { business, row } of owned) {
        const amount = pendingIncome(business, row, now);
        if (amount <= 0) continue;
        const res = await economy.run(
            'UPDATE user_businesses SET last_collect = ? WHERE user_jid = ? AND business_id = ? AND last_collect = ?',
            [now, jid, business.id, row.last_collect]
        );
        if (res.changes > 0) {
            total += amount;
            details.push({ business, amount });
        }
    }
    if (total > 0) await economy.credit(jid, total);
    return { total, details, owned: owned.length };
}

/** Paga una semana de mantenimiento. Si estaba vencido, primero se abonan las ganancias pendientes. */
async function payUpkeep(jid, business, now = Date.now()) {
    const owned = (await listOwned(jid)).find(item => item.business.id === business.id);
    if (!owned) return { ok: false, reason: 'not-owned' };
    const { row } = owned;
    const lapsed = Number(row.paid_until) < now;
    if (Number(row.paid_until) - now > MAX_PREPAID) return { ok: false, reason: 'too-early' };
    if (!(await economy.debit(jid, business.upkeep))) return { ok: false, reason: 'funds' };

    const base = Math.max(Number(row.paid_until), now);
    const res = await economy.run(
        'UPDATE user_businesses SET paid_until = ?, last_collect = ? WHERE user_jid = ? AND business_id = ? AND paid_until = ?',
        [base + WEEK, lapsed ? now : Number(row.last_collect), jid, business.id, row.paid_until]
    );
    if (res.changes === 0) {
        await economy.credit(jid, business.upkeep);
        return { ok: false, reason: 'busy' };
    }
    let recovered = 0;
    if (lapsed) {
        recovered = pendingIncome(business, row, now);
        if (recovered > 0) await economy.credit(jid, recovered);
    }
    return { ok: true, cost: business.upkeep, recovered, paidUntil: base + WEEK };
}

module.exports = { BUSINESSES, HOUR, WEEK, findBusiness, pendingIncome, listOwned, buy, collectAll, payUpkeep };
