const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// El módulo de base de datos imprime al conectar; eso corrompe el canal de eventos del ejecutor de tests.
console.log = () => {};

// Base de datos aislada: nunca tocar database/yuki.db.
delete process.env.DATABASE_URL;
process.env.YUKI_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'yuki-eco-'));

const db = require('../database/db');
const economy = require('../utils/economy');
const jobs = require('../utils/jobs');
const { COUNTRIES, findCountry } = require('../utils/countries');
const { QUESTIONS } = require('../utils/triviaQuestions');
const cmd = {
    allw: require('../commands/economy/allw'),
    alltop: require('../commands/economy/alltop'),
    bombardear: require('../commands/economy/bombardear'),
    cofre: require('../commands/economy/cofre'),
    esperas: require('../commands/economy/esperas'),
    hitos: require('../commands/economy/hitos'),
    trivia: require('../commands/economy/trivia'),
    uber: require('../commands/economy/uber'),
    ninero: require('../commands/economy/ninero')
};

test.after(() => new Promise(resolve => db.close(resolve)));

let counter = 0;
const newJid = () => `57300${String(1000000 + (counter += 1))}@s.whatsapp.net`;

function setUser(jid, { wallet = 0, bank = 0, name = 'Usuario', exp = 0 } = {}) {
    return new Promise((resolve, reject) => {
        db.getSafeUser(jid, error => {
            if (error) return reject(error);
            db.run('UPDATE users SET wallet = ?, bank = ?, name = ?, exp = ? WHERE jid = ?', [wallet, bank, name, exp, jid], err => (err ? reject(err) : resolve()));
        });
    });
}

const userRow = jid => new Promise((resolve, reject) => db.getSafeUser(jid, (error, row) => (error ? reject(error) : resolve(row))));

function fakeSock() {
    const sent = [];
    return { sent, sendMessage: async (chat, content, options) => { sent.push({ chat, content, options }); } };
}

function msg(text, jid, { group = '120363000000000001@g.us', mentioned } = {}) {
    const contextInfo = mentioned ? { mentionedJid: [mentioned] } : {};
    return { key: { remoteJid: group, participant: jid }, message: { extendedTextMessage: { text, contextInfo } } };
}

async function run(command, text, jid, extra) {
    const sock = fakeSock();
    const args = text.trim().split(/\s+/).slice(1);
    await command.execute(sock, msg(text, jid, extra), args, '!');
    return sock.sent;
}

function seq(...values) {
    let index = 0;
    return () => values[Math.min(index++, values.length - 1)];
}

async function withRandom(value, callback) {
    const original = Math.random;
    Math.random = typeof value === 'function' ? value : () => value;
    try { return await callback(); } finally { Math.random = original; }
}

// ------------------------------------------------------------------ datos

test('193 países únicos y búsqueda tolerante a acentos', () => {
    assert.equal(COUNTRIES.length, 193);
    assert.equal(new Set(COUNTRIES).size, 193);
    assert.equal(findCountry('chile'), 'Chile');
    assert.equal(findCountry('PERU'), 'Perú');
    assert.equal(findCountry('colom'), 'Colombia');
    assert.equal(findCountry('guinea'), 'Guinea');
    assert.equal(findCountry('san'), null, 'un prefijo ambiguo no debe elegir uno al azar');
    assert.equal(findCountry('narnia'), null);
    assert.equal(findCountry(''), null);
});

test('preguntas de trivia bien formadas', () => {
    assert.ok(QUESTIONS.length >= 40);
    const seen = new Set();
    for (const item of QUESTIONS) {
        assert.ok(item.q && item.correct && item.wrong.length === 3, item.q);
        const options = [item.correct, ...item.wrong];
        assert.equal(new Set(options).size, 4, `opciones repetidas en: ${item.q}`);
        assert.ok(!seen.has(item.q), `pregunta repetida: ${item.q}`);
        seen.add(item.q);
    }
});

test('definición de trabajos coherente', () => {
    assert.equal(jobs.JOBS.length, 10);
    const names = new Set();
    for (const job of jobs.JOBS) {
        assert.ok(job.min > 0 && job.min <= job.max, job.key);
        assert.ok(job.cooldownMs >= 30 * 60 * 1000, job.key);
        assert.ok(job.failChance >= 0 && job.failChance < 1, job.key);
        if (job.failChance > 0) assert.ok(job.fails.length > 0 && job.lossMin > 0 && job.lossMin <= job.lossMax, job.key);
        assert.ok(job.wins.length >= 2, job.key);
        for (const name of [job.name, ...job.aliases]) {
            assert.ok(!names.has(name), `nombre repetido: ${name}`);
            names.add(name);
        }
    }
});

// ------------------------------------------------------------------ lógica de trabajos

test('un trabajo paga dentro del rango y después queda en espera', async () => {
    const jid = newJid();
    await setUser(jid);
    const job = jobs.JOBS_BY_KEY.get('vendedor');
    const first = await jobs.performJob(jid, job, { rng: seq(0.5, 0.5, 0.5) });
    assert.equal(first.ok, true);
    assert.equal(first.success, true);
    assert.ok(first.amount >= job.min && first.amount <= job.max);
    assert.equal((await userRow(jid)).wallet, first.amount);

    const second = await jobs.performJob(jid, job, { rng: seq(0.5, 0.5, 0.5) });
    assert.equal(second.ok, false);
    assert.ok(second.remainingMs > 29 * 60 * 1000 && second.remainingMs <= job.cooldownMs);
    assert.equal((await userRow(jid)).wallet, first.amount, 'el dinero no debe cambiar mientras está en espera');
});

test('un fallo nunca deja la billetera en negativo', async () => {
    const job = jobs.JOBS_BY_KEY.get('mazmorra');

    const poor = newJid();
    await setUser(poor, { wallet: 0 });
    const none = await jobs.performJob(poor, job, { rng: seq(0, 0, 0) });
    assert.deepEqual([none.ok, none.success, none.amount], [true, false, 0]);
    assert.equal((await userRow(poor)).wallet, 0);

    const some = newJid();
    await setUser(some, { wallet: 300 });
    const partial = await jobs.performJob(some, job, { rng: seq(0, 0, 0) });
    assert.equal(partial.success, false);
    assert.equal(partial.amount, 300, 'solo se pierde lo que hay (la pérdida mínima es 500)');
    assert.equal((await userRow(some)).wallet, 0);

    const rich = newJid();
    await setUser(rich, { wallet: 10000 });
    const full = await jobs.performJob(rich, job, { rng: seq(0, 0.99, 0) });
    assert.ok(full.amount >= job.lossMin && full.amount <= job.lossMax);
    assert.equal((await userRow(rich)).wallet, 10000 - full.amount);
});

test('las esperas son por usuario y por trabajo', async () => {
    const a = newJid();
    const b = newJid();
    await setUser(a);
    await setUser(b);
    const uber = jobs.JOBS_BY_KEY.get('uber');
    const vendedor = jobs.JOBS_BY_KEY.get('vendedor');
    assert.equal((await jobs.performJob(a, uber, { rng: seq(0.9, 0.5, 0.5) })).ok, true);
    assert.equal((await jobs.performJob(a, uber, { rng: seq(0.9, 0.5, 0.5) })).ok, false);
    assert.equal((await jobs.performJob(b, uber, { rng: seq(0.9, 0.5, 0.5) })).ok, true, 'otro usuario no se ve afectado');
    assert.equal((await jobs.performJob(a, vendedor, { rng: seq(0.9, 0.5, 0.5) })).ok, true, 'otro trabajo no se ve afectado');
});

test('cinco intentos simultáneos cobran la recompensa una sola vez', async () => {
    const jid = newJid();
    await setUser(jid);
    const job = jobs.JOBS_BY_KEY.get('migajear');
    const results = await Promise.all(Array.from({ length: 5 }, () => jobs.performJob(jid, job, { rng: seq(0.5, 0.5, 0.5) })));
    assert.equal(results.filter(result => result.ok).length, 1);
    const paid = results.find(result => result.ok).amount;
    assert.equal((await userRow(jid)).wallet, paid);
});

test('si el pago falla, la espera se libera y se puede reintentar', async () => {
    const jid = newJid();
    await setUser(jid);
    const job = jobs.JOBS_BY_KEY.get('youtuber');
    const original = economy.credit;
    economy.credit = async () => { throw new Error('base de datos caída'); };
    try {
        await assert.rejects(jobs.performJob(jid, job, { rng: seq(0.5, 0.5, 0.5) }), /base de datos caída/);
    } finally {
        economy.credit = original;
    }
    const retry = await jobs.performJob(jid, job, { rng: seq(0.5, 0.5, 0.5) });
    assert.equal(retry.ok, true);
});

// ------------------------------------------------------------------ comandos

test('trabajos por comando: responde con el resultado y luego con la espera', async () => {
    const jid = newJid();
    await setUser(jid);
    const first = await withRandom(0.5, () => run(cmd.uber, '!uber', jid));
    assert.match(first[0].content.text, /Uber/);
    assert.match(first[0].content.text, /\+\$/);
    const second = await run(cmd.uber, '!uber', jid);
    assert.match(second[0].content.text, /Aún no puedes usar \*Uber\*/);
});

test('cofre: una vez al día y la tabla de rareza es correcta', async () => {
    assert.equal(cmd.cofre.openChest(() => 0.0).tier.name, 'Común');
    assert.equal(cmd.cofre.openChest(() => 0.7).tier.name, 'Raro');
    assert.equal(cmd.cofre.openChest(() => 0.95).tier.name, 'Épico');
    assert.equal(cmd.cofre.openChest(() => 0.995).tier.name, 'Legendario');

    const jid = newJid();
    await setUser(jid);
    const first = await withRandom(0.0, () => run(cmd.cofre, '!cofre', jid));
    assert.match(first[0].content.text, /Común/);
    assert.equal((await userRow(jid)).wallet, 300);
    const again = await run(cmd.cofre, '!cofre', jid);
    assert.match(again[0].content.text, /Ya abriste tu cofre/);
    assert.equal((await userRow(jid)).wallet, 300);
});

test('trivia: acierto paga monedas y XP, fallo no paga y no hay doble respuesta', async () => {
    const jid = newJid();
    await setUser(jid, { exp: 490 });
    const group = '120363000000000002@g.us';

    const none = await run(cmd.trivia, '!trivia a', jid, { group });
    assert.match(none[0].content.text, /No tienes una trivia pendiente/);

    const asked = await run(cmd.trivia, '!trivia', jid, { group });
    assert.match(asked[0].content.text, /A\) .*\nB\) .*\nC\) .*\nD\) /s);
    const session = cmd.trivia.sessions.get(`${group}:${jid}`);
    assert.ok(session && session.answerIndex >= 0 && session.answerIndex < 4);

    const repeat = await run(cmd.trivia, '!trivia', jid, { group });
    assert.match(repeat[0].content.text, /Trivia/, 'con una pregunta pendiente se repite, sin gastar otra espera');

    const invalid = await run(cmd.trivia, '!trivia z', jid, { group });
    assert.match(invalid[0].content.text, /Responde con \*a\*/);

    const letter = 'abcd'[session.answerIndex];
    const right = await run(cmd.trivia, `!trivia ${letter}`, jid, { group });
    assert.match(right[0].content.text, /Correcto/);
    const row = await userRow(jid);
    assert.equal(row.wallet, cmd.trivia.REWARD);
    assert.equal(row.exp, 510);
    assert.equal(row.level, 2, '510 XP ya es nivel 2');

    const twice = await run(cmd.trivia, `!trivia ${letter}`, jid, { group });
    assert.match(twice[0].content.text, /No tienes una trivia pendiente/);
    assert.equal((await userRow(jid)).wallet, cmd.trivia.REWARD, 'no se paga dos veces');

    const wait = await run(cmd.trivia, '!trivia', jid, { group });
    assert.match(wait[0].content.text, /Espera/);
});

test('trivia: una respuesta incorrecta muestra la correcta y no paga', async () => {
    const jid = newJid();
    await setUser(jid);
    const group = '120363000000000003@g.us';
    await run(cmd.trivia, '!trivia', jid, { group });
    const session = cmd.trivia.sessions.get(`${group}:${jid}`);
    const wrong = 'abcd'[(session.answerIndex + 1) % 4];
    const result = await run(cmd.trivia, `!trivia ${wrong}`, jid, { group });
    assert.match(result[0].content.text, /La respuesta correcta era/);
    assert.equal((await userRow(jid)).wallet, 0);
});

test('trivia: la pregunta caduca a los 45 segundos', async () => {
    const jid = newJid();
    await setUser(jid);
    const group = '120363000000000004@g.us';
    await run(cmd.trivia, '!trivia', jid, { group });
    cmd.trivia.sessions.get(`${group}:${jid}`).expires = Date.now() - 1;
    const late = await run(cmd.trivia, '!trivia a', jid, { group });
    assert.match(late[0].content.text, /No tienes una trivia pendiente/);
});

test('bombardear: país inválido no gasta la espera; ganar paga; perder nunca deja negativo', async () => {
    const jid = newJid();
    await setUser(jid, { wallet: 100 });

    const bad = await run(cmd.bombardear, '!bombardear Narnia', jid);
    assert.match(bad[0].content.text, /No encontré ese país/);

    const win = await withRandom(0.1, () => run(cmd.bombardear, '!bombardear chile', jid));
    assert.match(win[0].content.text, /Chile/);
    assert.match(win[0].content.text, /\+\$/);
    assert.equal((await userRow(jid)).wallet, 100 + 700);

    const blocked = await run(cmd.bombardear, '!bombardear peru', jid);
    assert.match(blocked[0].content.text, /se está recargando/);

    const loser = newJid();
    await setUser(loser, { wallet: 50 });
    const lose = await withRandom(0.9, () => run(cmd.bombardear, '!bombardear', loser));
    assert.match(lose[0].content.text, /-\$50/);
    assert.equal((await userRow(loser)).wallet, 0);
});

test('allw reclama todos los trabajos disponibles en un solo mensaje', async () => {
    const jid = newJid();
    await setUser(jid, { wallet: 5000 });
    const first = await withRandom(0.99, () => run(cmd.allw, '!allw', jid));
    assert.equal(first.length, 1, 'un único mensaje, no uno por trabajo');
    const text = first[0].content.text;
    for (const job of jobs.JOBS) assert.ok(text.includes(job.label), `falta ${job.label}`);
    assert.match(text, /Total: \+\$/);

    const second = await run(cmd.allw, '!allw', jid);
    assert.match(second[0].content.text, /No hay ningún trabajo disponible/);
});

test('esperas muestra qué está listo y qué está en espera', async () => {
    const jid = newJid();
    await setUser(jid);
    await withRandom(0.5, () => run(cmd.uber, '!uber', jid));
    const sent = await run(cmd.esperas, '!esperas', jid);
    const text = sent[0].content.text;
    assert.match(text, /⏳ Uber: /);
    assert.match(text, /✅ Vendedor ambulante: disponible/);
    assert.match(text, /✅ Cofre misterioso: disponible/);
    assert.match(text, /✅ Daily: disponible/);
});

test('hitos calcula insignias y la siguiente meta', async () => {
    assert.equal(cmd.hitos.evaluate(0).reached.length, 0);
    assert.equal(cmd.hitos.evaluate(0).next.at, 1000);
    assert.equal(cmd.hitos.evaluate(10000).reached.length, 2);
    assert.equal(cmd.hitos.evaluate(10_000_000).next, null);

    const jid = newJid();
    await setUser(jid, { wallet: 600, bank: 450 });
    const sent = await run(cmd.hitos, '!hitos', jid);
    assert.match(sent[0].content.text, /Primer ahorro/);
    assert.match(sent[0].content.text, /Patrimonio: \*\$1\.050\*/);
    assert.match(sent[0].content.text, /Siguiente meta: \*🥈 Ahorrador\*/);
});

test('alltop arma el mensaje aunque falte alguna tabla', async () => {
    const rich = newJid();
    await setUser(rich, { wallet: 9_000_000, name: 'Ricardo', exp: 100 });
    const sent = await run(cmd.alltop, '!alltop', rich, { group: '120363000000000009@g.us' });
    const text = sent[0].content.text;
    assert.match(text, /Patrimonio/);
    assert.match(text, /Experiencia/);
    assert.match(text, /Ricardo/);
    assert.ok(!text.includes('undefined'));
});

test('todos los comandos nuevos exportan nombre, categoría y execute', () => {
    for (const command of Object.values(cmd)) {
        assert.equal(typeof command.name, 'string');
        assert.equal(command.category, 'economy');
        assert.equal(typeof command.execute, 'function');
    }
});
