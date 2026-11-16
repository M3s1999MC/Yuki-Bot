// utils/adventure.js
// Aventuras y salud: !aventura paga bien pero gasta vida; !curar la recupera con dinero. La vida también regenera sola.
const economy = require('./economy');
const { claim, release } = require('./cooldowns');
const { ensureTables } = require('./extraTables');

const MAX_HP = 100;
const MIN_HP_TO_GO = 20;
const REGEN_MS = 60 * 1000;        // 1 punto de vida por minuto
const HEAL_COST_PER_HP = 10;
const ADVENTURE_COOLDOWN_MS = 45 * 60 * 1000;
const ADVENTURE_KEY = 'adventure';

async function getHp(jid, now = Date.now()) {
    await ensureTables();
    const row = await economy.get('SELECT hp, updated_at FROM eco_health WHERE user_jid = ?', [jid]);
    if (!row) return MAX_HP;
    const regen = Math.floor(Math.max(0, now - Number(row.updated_at)) / REGEN_MS);
    return Math.min(MAX_HP, Math.max(0, Number(row.hp)) + regen);
}

async function setHp(jid, hp, now = Date.now()) {
    await ensureTables();
    const value = Math.max(0, Math.min(MAX_HP, Math.floor(hp)));
    await economy.run(
        'INSERT INTO eco_health (user_jid, hp, updated_at) VALUES (?, ?, ?) ON CONFLICT (user_jid) DO UPDATE SET hp = ?, updated_at = ?',
        [jid, value, now, value, now]
    );
    return value;
}

const WINS = [
    'Exploraste unas ruinas y encontraste un cofre olvidado.',
    'Un mercader te pagó muy bien por escoltar su caravana.',
    'Derrotaste a un jefe menor y su botín fue tuyo.'
];
const FAILS = [
    'Una emboscada te dejó herido y sin parte del botín.',
    'Caíste en una trampa antigua y tuviste que pagar para que te sacaran.'
];

/**
 * @returns {Promise<{ok:false, reason:'hurt', hp:number} | {ok:false, reason:'cooldown', remainingMs:number}
 *   | {ok:true, success:boolean, amount:number, hpLost:number, hp:number, text:string}>}
 */
async function performAdventure(jid, { now = Date.now(), rng = Math.random } = {}) {
    await economy.ensureUser(jid);
    const hp = await getHp(jid, now);
    if (hp < MIN_HP_TO_GO) return { ok: false, reason: 'hurt', hp };

    const cooldown = await claim(jid, ADVENTURE_KEY, ADVENTURE_COOLDOWN_MS, now);
    if (!cooldown.ok) return { ok: false, reason: 'cooldown', remainingMs: cooldown.remainingMs };

    try {
        if (rng() < 0.3) {
            const lost = await economy.debitUpTo(jid, economy.rollBetween(300, 1000, rng));
            const hpLost = economy.rollBetween(20, 35, rng);
            const left = await setHp(jid, hp - hpLost, now);
            return { ok: true, success: false, amount: lost, hpLost, hp: left, text: economy.pickFrom(FAILS, rng) };
        }
        const gain = economy.rollBetween(1500, 4000, rng);
        const hpLost = economy.rollBetween(5, 15, rng);
        await economy.credit(jid, gain);
        await economy.addExp(jid, 30);
        const left = await setHp(jid, hp - hpLost, now);
        return { ok: true, success: true, amount: gain, hpLost, hp: left, text: economy.pickFrom(WINS, rng) };
    } catch (error) {
        await release(jid, ADVENTURE_KEY).catch(() => {});
        throw error;
    }
}

/** Cura todo lo que alcance el dinero de la billetera (10 por punto de vida). */
async function heal(jid, now = Date.now()) {
    const hp = await getHp(jid, now);
    const missing = MAX_HP - hp;
    if (missing <= 0) return { ok: false, reason: 'full', hp };
    const wallet = await economy.getWallet(jid);
    const points = Math.min(missing, Math.floor(wallet / HEAL_COST_PER_HP));
    if (points <= 0) return { ok: false, reason: 'funds', hp, needed: HEAL_COST_PER_HP };
    if (!(await economy.debit(jid, points * HEAL_COST_PER_HP))) return { ok: false, reason: 'funds', hp, needed: HEAL_COST_PER_HP };
    const after = await setHp(jid, hp + points, now);
    return { ok: true, healed: points, cost: points * HEAL_COST_PER_HP, hp: after };
}

module.exports = { MAX_HP, MIN_HP_TO_GO, HEAL_COST_PER_HP, getHp, setHp, performAdventure, heal };
