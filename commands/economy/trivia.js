const economy = require('../../utils/economy');
const { claim, formatDuration } = require('../../utils/cooldowns');
const { TRIVIA } = require('../../utils/ecoConfig');
const { QUESTIONS } = require('../../utils/triviaQuestions');
const { reply, senderJid } = require('../../utils/commandHelpers');

const SESSION_MS = 45 * 1000;
const REWARD = 400;
const EXP = 20;
const LETTERS = ['a', 'b', 'c', 'd'];

// Pregunta pendiente por usuario y chat. Vive en memoria: si el bot se reinicia, se pierde (no hay dinero en juego).
const sessions = new Map();

function sessionKey(m, jid) {
    return `${m.key.remoteJid}:${jid}`;
}

function shuffle(list, rng = Math.random) {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(rng() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function renderQuestion(session) {
    const options = session.options.map((option, index) => `${LETTERS[index].toUpperCase()}) ${option}`).join('\n');
    return `「✿」 🧠 *Trivia*\n\n${session.question}\n\n${options}\n\nResponde con *!trivia a*, *b*, *c* o *d* (tienes 45 s).`;
}

function parseChoice(raw) {
    const value = String(raw || '').toLowerCase();
    if (LETTERS.includes(value)) return LETTERS.indexOf(value);
    if (/^[1-4]$/.test(value)) return Number(value) - 1;
    return -1;
}

module.exports = {
    name: 'trivia',
    aliases: [],
    category: 'economy',
    description: 'Responde una pregunta de cultura general y gana monedas y experiencia',

    async execute(sock, m, args) {
        const jid = senderJid(m, sock);
        const key = sessionKey(m, jid);
        const now = Date.now();
        try {
            for (const [stored, session] of sessions) {
                if (session.expires <= now) sessions.delete(stored);
            }

            const active = sessions.get(key);
            if (args[0]) {
                const choice = parseChoice(args[0]);
                if (!active) {
                    return reply(sock, m, '「✿」 No tienes una trivia pendiente. Empieza una con *!trivia* 🧠');
                }
                if (choice < 0) {
                    return reply(sock, m, `「✿」 Responde con *a*, *b*, *c* o *d*.\n\n${renderQuestion(active)}`);
                }
                sessions.delete(key);
                if (choice === active.answerIndex) {
                    await economy.credit(jid, REWARD);
                    await economy.addExp(jid, EXP);
                    return reply(sock, m, `「✿」 ✅ ¡Correcto! *${active.options[active.answerIndex]}*\n\n*+${economy.money(REWARD)}* y *+${EXP} XP* 🌸`);
                }
                return reply(sock, m, `「✿」 ❌ Esa no era. La respuesta correcta era *${LETTERS[active.answerIndex].toUpperCase()}) ${active.options[active.answerIndex]}*.`);
            }

            if (active) return reply(sock, m, renderQuestion(active));

            await economy.ensureUser(jid);
            const cooldown = await claim(jid, TRIVIA.key, TRIVIA.ms);
            if (!cooldown.ok) {
                return reply(sock, m, `「✿」 ⏳ Espera *${formatDuration(cooldown.remainingMs)}* para otra trivia.`);
            }
            const question = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
            const options = shuffle([question.correct, ...question.wrong]);
            const session = {
                question: question.q,
                options,
                answerIndex: options.indexOf(question.correct),
                expires: now + SESSION_MS
            };
            sessions.set(key, session);
            return reply(sock, m, renderQuestion(session));
        } catch (error) {
            console.error('Error en !trivia:', error.message);
            return reply(sock, m, '「✿」 No pude preparar la trivia; inténtalo de nuevo en un momento.');
        }
    },
    sessions,
    REWARD,
    EXP,
    shuffle,
    parseChoice
};
