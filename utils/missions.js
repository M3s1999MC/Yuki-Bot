// utils/missions.js
// Misiones diarias de economía. El progreso se anota solo cuando la acción realmente se completó.
const economy = require('./economy');
const { ensureTables } = require('./extraTables');

const MISSIONS = [
    { key: 'trabajos', label: 'Hacer 3 trabajos', goal: 3, reward: 1500, exp: 30 },
    { key: 'cofre', label: 'Abrir el cofre diario', goal: 1, reward: 800, exp: 20 },
    { key: 'trivia', label: 'Ganar una trivia', goal: 1, reward: 600, exp: 20 },
    { key: 'negocio', label: 'Cobrar ganancias de tus negocios', goal: 1, reward: 1000, exp: 30 }
];

/** Día calendario en hora de Colombia (UTC-5), para que las misiones se reinicien a medianoche local. */
function dayKey(now = Date.now()) {
    return new Date(now - 5 * 3600000).toISOString().slice(0, 10);
}

/** Suma progreso; nunca lanza error para no romper el comando que lo llamó. */
async function track(jid, key, amount = 1, now = Date.now()) {
    try {
        if (!MISSIONS.some(item => item.key === key)) return;
        await ensureTables();
        await economy.run(
            `INSERT INTO eco_missions (user_jid, mission_key, day, progress, claimed) VALUES (?, ?, ?, ?, 0)
             ON CONFLICT (user_jid, mission_key, day) DO UPDATE SET progress = eco_missions.progress + ?`,
            [jid, key, dayKey(now), amount, amount]
        );
    } catch (error) {
        console.error('missions.track:', error.message);
    }
}

async function status(jid, now = Date.now()) {
    await ensureTables();
    const rows = await economy.all('SELECT mission_key, progress, claimed FROM eco_missions WHERE user_jid = ? AND day = ?', [jid, dayKey(now)]);
    return MISSIONS.map(mission => {
        const row = rows.find(item => item.mission_key === mission.key);
        const progress = Math.min(Number(row?.progress) || 0, mission.goal);
        return { ...mission, progress, claimed: Boolean(Number(row?.claimed)), done: progress >= mission.goal };
    });
}

async function claimAll(jid, now = Date.now()) {
    const claimed = [];
    for (const mission of await status(jid, now)) {
        if (!mission.done || mission.claimed) continue;
        const res = await economy.run(
            'UPDATE eco_missions SET claimed = 1 WHERE user_jid = ? AND mission_key = ? AND day = ? AND claimed = 0 AND progress >= ?',
            [jid, mission.key, dayKey(now), mission.goal]
        );
        if (res.changes > 0) {
            await economy.credit(jid, mission.reward);
            await economy.addExp(jid, mission.exp);
            claimed.push(mission);
        }
    }
    return claimed;
}

module.exports = { MISSIONS, dayKey, track, status, claimAll };
