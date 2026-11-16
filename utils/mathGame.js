// utils/mathGame.js
// Problemas de matemáticas por dificultad. Las sesiones viven en memoria y vencen a los 30 segundos.
const DIFFICULTIES = {
    facil: { label: 'Fácil', reward: 150 },
    medio: { label: 'Medio', reward: 400 },
    dificil: { label: 'Difícil', reward: 900 },
    imposible: { label: 'Imposible', reward: 2000 }
};
const ALIASES = { easy: 'facil', fácil: 'facil', normal: 'medio', medium: 'medio', hard: 'dificil', difícil: 'dificil', impossible: 'imposible' };
const SESSION_MS = 30 * 1000;

const between = (min, max, rng) => min + Math.floor(rng() * (max - min + 1));

function normalizeDifficulty(text) {
    const value = String(text || '').trim().toLowerCase();
    if (!value) return 'medio';
    if (DIFFICULTIES[value]) return value;
    return ALIASES[value] || null;
}

function makeProblem(difficulty, rng = Math.random) {
    if (difficulty === 'facil') {
        const a = between(2, 20, rng), b = between(1, 20, rng);
        return rng() < 0.5 ? { text: `${a} + ${b}`, answer: a + b } : { text: `${a + b} - ${b}`, answer: a };
    }
    if (difficulty === 'medio') {
        const a = between(2, 12, rng), b = between(2, 12, rng), c = between(1, 30, rng);
        return rng() < 0.5 ? { text: `${a} × ${b}`, answer: a * b } : { text: `${a} × ${b} + ${c}`, answer: a * b + c };
    }
    if (difficulty === 'dificil') {
        const a = between(5, 30, rng), b = between(5, 30, rng), c = between(2, 9, rng), d = between(1, 50, rng);
        return { text: `(${a} + ${b}) × ${c} − ${d}`, answer: (a + b) * c - d };
    }
    const a = between(12, 40, rng), b = between(12, 40, rng), c = between(12, 40, rng), d = between(2, 15, rng);
    return { text: `${a} × ${b} + ${c} × ${d}`, answer: a * b + c * d };
}

const sessions = new Map();
const sessionKey = (chat, jid) => `${chat}|${jid}`;

function startSession(chat, jid, difficulty, { now = Date.now(), rng = Math.random } = {}) {
    const problem = makeProblem(difficulty, rng);
    const session = { ...problem, difficulty, expiresAt: now + SESSION_MS };
    sessions.set(sessionKey(chat, jid), session);
    return session;
}

/** Sesión vigente (borra la vencida). */
function getSession(chat, jid, now = Date.now()) {
    const key = sessionKey(chat, jid);
    const session = sessions.get(key);
    if (session && session.expiresAt <= now) {
        sessions.delete(key);
        return { expired: true, session };
    }
    return session ? { expired: false, session } : null;
}

function endSession(chat, jid) {
    sessions.delete(sessionKey(chat, jid));
}

module.exports = { DIFFICULTIES, SESSION_MS, normalizeDifficulty, makeProblem, startSession, getSession, endSession };
