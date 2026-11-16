const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

console.log = () => {};
delete process.env.DATABASE_URL;
process.env.YUKI_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'yuki-oz-'));

const db = require('../database/db');
const economy = require('../utils/economy');
const jobs = require('../utils/jobs');
const adventure = require('../utils/adventure');
const game = require('../utils/mathGame');
const cmd = {
    coinflip: require('../commands/economy/coinflip'),
    ppt: require('../commands/economy/ppt'),
    math: require('../commands/economy/math'),
    aventura: require('../commands/economy/aventura'),
    curar: require('../commands/economy/curar'),
    board: require('../commands/economy/economyboard'),
    info: require('../commands/economy/economyinfo'),
    cazar: require('../commands/economy/cazar'),
    pescar: require('../commands/economy/pescar')
};

test.after(() => new Promise(resolve => db.close(resolve)));

const GROUP = '120363000000000055@g.us';
let counter = 0;
const newJid = () => `57344${String(1000000 + (counter += 1))}@s.whatsapp.net`;
const setWallet = async (jid, wallet, bank = 0) => {
    await economy.ensureUser(jid);
    await economy.run('UPDATE users SET wallet = ?, bank = ? WHERE jid = ?', [wallet, bank, jid]);
};
const wallet = jid => economy.getWallet(jid);

async function run(command, jid, text, extra = {}) {
    const sent = [];
    const sock = { sendMessage: async (chat, content) => { sent.push(content.text); } };
    const m = { key: { remoteJid: GROUP, participant: jid }, message: { extendedTextMessage: { text, contextInfo: extra.contextInfo || {} } } };
    await command.execute(sock, m, text.trim().split(/\s+/).slice(1), '!');
    return sent.join('\n');
}
async function withRandom(value, callback) {
    const original = Math.random;
    Math.random = typeof value === 'function' ? value : () => value;
    try { return await callback(); } finally { Math.random = original; }
}
const seq = (...values) => { let i = 0; return () => values[Math.min(i++, values.length - 1)]; };

test('cazar y pescar son trabajos con espera', async () => {
    assert.ok(jobs.JOBS_BY_KEY.has('cazar') && jobs.JOBS_BY_KEY.has('pescar'));
    const jid = newJid();
    await setWallet(jid, 0);
    const win = await jobs.performJob(jid, jobs.JOBS_BY_KEY.get('pescar'), { rng: () => 0.99 });
    assert.equal(win.success, true);
    assert.ok(win.amount >= 250 && win.amount <= 900);
    assert.equal((await jobs.performJob(jid, jobs.JOBS_BY_KEY.get('pescar'), { rng: () => 0.99 })).ok, false);
    assert.match(await run(cmd.cazar, jid, '!cazar'), /Cacer|Cazaste|Ya|Aún|\+|−|-/);
});

test('aventura: éxito paga y gasta vida; la vida baja pero nunca queda negativa', async () => {
    const jid = newJid();
    await setWallet(jid, 0);
    const now = 10_000_000;
    const result = await adventure.performAdventure(jid, { now, rng: () => 0.9 });
    assert.equal(result.ok, true);
    assert.equal(result.success, true);
    assert.ok(result.amount >= 1500 && result.amount <= 4000);
    assert.equal(result.hp, 100 - result.hpLost);
    assert.equal(await wallet(jid), result.amount);
    assert.equal((await adventure.getHp(jid, now)), result.hp);
});

test('aventura: fracaso cobra sin dejar saldo negativo y quita más vida', async () => {
    const jid = newJid();
    await setWallet(jid, 100);
    const result = await adventure.performAdventure(jid, { now: 1, rng: () => 0.1 });
    assert.equal(result.success, false);
    assert.equal(result.amount, 100);
    assert.equal(await wallet(jid), 0);
    assert.ok(result.hpLost >= 20 && result.hpLost <= 35);
});

test('aventura: muy herido no puede salir ni gasta la espera; en cooldown avisa', async () => {
    const jid = newJid();
    await setWallet(jid, 0);
    await adventure.setHp(jid, 10, 5_000);
    const hurt = await adventure.performAdventure(jid, { now: 5_000, rng: () => 0.9 });
    assert.deepEqual([hurt.ok, hurt.reason], [false, 'hurt']);
    // Con regeneración (1 punto por minuto) ya puede salir y recién ahí se usa la espera.
    const later = 5_000 + 12 * 60_000;
    const go = await adventure.performAdventure(jid, { now: later, rng: () => 0.9 });
    assert.equal(go.ok, true);
    // Después de la aventura le queda poca vida: sigue herido (se revisa antes que la espera).
    const again = await adventure.performAdventure(jid, { now: later + 1000, rng: () => 0.9 });
    assert.deepEqual([again.ok, again.reason], [false, 'hurt']);
});

test('aventura: con vida suficiente, repetir antes de tiempo avisa la espera', async () => {
    const jid = newJid();
    await setWallet(jid, 0);
    const now = 40_000_000;
    assert.equal((await adventure.performAdventure(jid, { now, rng: () => 0.9 })).ok, true);
    const again = await adventure.performAdventure(jid, { now: now + 1000, rng: () => 0.9 });
    assert.deepEqual([again.ok, again.reason], [false, 'cooldown']);
    assert.ok(again.remainingMs > 0);
    assert.equal((await adventure.performAdventure(jid, { now: now + 46 * 60_000, rng: () => 0.9 })).ok, true);
});

test('curar: cuesta 10 por punto, cura lo que alcance y avisa si ya está completa', async () => {
    const jid = newJid();
    await setWallet(jid, 0);
    const now = 77_000;
    await adventure.setHp(jid, 50, now);
    assert.equal((await adventure.heal(jid, now)).reason, 'funds');

    await setWallet(jid, 200);
    const partial = await adventure.heal(jid, now);
    assert.deepEqual([partial.ok, partial.healed, partial.cost, partial.hp], [true, 20, 200, 70]);
    assert.equal(await wallet(jid), 0);

    await setWallet(jid, 5000);
    const full = await adventure.heal(jid, now);
    assert.deepEqual([full.healed, full.cost, full.hp], [30, 300, 100]);
    assert.equal((await adventure.heal(jid, now)).reason, 'full');
    assert.match(await run(cmd.curar, jid, '!curar'), /vida completa/);
});

test('coinflip: parseBet, ganar paga el doble, perder descuenta, errores no cobran', async () => {
    assert.deepEqual(cmd.coinflip.parseBet(['500', 'cara'], 1000), { side: 'cara', amount: 500 });
    assert.deepEqual(cmd.coinflip.parseBet(['all', 'sello'], 1000), { side: 'cruz', amount: 1000 });
    assert.deepEqual(cmd.coinflip.parseBet(['hola'], 1000), { side: null, amount: null });

    const jid = newJid();
    await setWallet(jid, 1000);
    assert.match(await run(cmd.coinflip, jid, '!coinflip 500'), /Uso:/);
    assert.match(await run(cmd.coinflip, jid, '!coinflip 5000 cara'), /No tienes tanto/);
    assert.equal(await wallet(jid), 1000);

    assert.match(await withRandom(0.1, () => run(cmd.coinflip, jid, '!coinflip 500 cara')), /Ganaste/);
    assert.equal(await wallet(jid), 1500);
    assert.match(await run(cmd.coinflip, jid, '!coinflip 100 cara'), /Espera/); // cooldown de 8 s
    assert.equal(await wallet(jid), 1500);

    const other = newJid();
    await setWallet(other, 1000);
    assert.match(await withRandom(0.9, () => run(cmd.coinflip, other, '!cf all cara')), /Perdiste/);
    assert.equal(await wallet(other), 0);
});

test('ppt: tabla de resultados y pagos', async () => {
    assert.equal(cmd.ppt.outcome('piedra', 'tijera'), 'win');
    assert.equal(cmd.ppt.outcome('papel', 'tijera'), 'lose');
    assert.equal(cmd.ppt.outcome('tijera', 'tijera'), 'tie');

    const jid = newJid();
    await setWallet(jid, 1000);
    assert.match(await run(cmd.ppt, jid, '!ppt'), /Uso:/);
    assert.match(await withRandom(0, () => run(cmd.ppt, jid, '!ppt papel')), /Ganaste/); // el bot saca piedra
    assert.equal(await wallet(jid), 1200);

    const loser = newJid();
    await setWallet(loser, 1000);
    assert.match(await withRandom(0, () => run(cmd.ppt, loser, '!ppt tijera')), /Perdiste/);
    assert.equal(await wallet(loser), 800);

    const tie = newJid();
    await setWallet(tie, 1000);
    assert.match(await withRandom(0, () => run(cmd.ppt, tie, '!ppt piedra')), /Empate/);
    assert.equal(await wallet(tie), 1000);

    const poor = newJid();
    await setWallet(poor, 50);
    assert.match(await run(cmd.ppt, poor, '!ppt piedra'), /Necesitas/);
});

test('mathGame: la respuesta siempre coincide con la operación mostrada', () => {
    let seed = 7;
    const rng = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (const difficulty of Object.keys(game.DIFFICULTIES)) {
        for (let i = 0; i < 200; i += 1) {
            const { text, answer } = game.makeProblem(difficulty, rng);
            const expression = text.replace(/×/g, '*').replace(/−/g, '-');
            assert.equal(Function(`"use strict"; return (${expression});`)(), answer, `${difficulty}: ${text}`);
            assert.ok(Number.isInteger(answer) && answer >= 0);
        }
    }
    assert.equal(game.normalizeDifficulty(''), 'medio');
    assert.equal(game.normalizeDifficulty('Difícil'), 'dificil');
    assert.equal(game.normalizeDifficulty('xyz'), null);
});

test('math: responder bien paga, mal o vencido no, y no hay sesión sin empezar', async () => {
    const jid = newJid();
    await setWallet(jid, 0);
    assert.match(await run(cmd.math, jid, '!math 12'), /No tienes un problema activo/);
    assert.match(await run(cmd.math, jid, '!math locura'), /Dificultades/);

    assert.match(await run(cmd.math, jid, '!math facil'), /Matemáticas \(Fácil\)/);
    assert.match(await run(cmd.math, jid, '!math facil'), /Ya tienes un problema/);
    const { session } = game.getSession(GROUP, jid);
    assert.match(await run(cmd.math, jid, `!math ${session.answer}`), /Correcto/);
    assert.equal(await wallet(jid), 150);
    assert.match(await run(cmd.math, jid, `!math ${session.answer}`), /No tienes un problema activo/); // no se cobra dos veces

    const wrong = newJid();
    await setWallet(wrong, 0);
    await run(cmd.math, wrong, '!math medio');
    const s2 = game.getSession(GROUP, wrong).session;
    assert.match(await run(cmd.math, wrong, `!math ${s2.answer + 1}`), /Incorrecto/);
    assert.equal(await wallet(wrong), 0);

    const slow = newJid();
    game.startSession(GROUP, slow, 'facil', { now: Date.now() - 60_000 });
    assert.match(await run(cmd.math, slow, '!math 1'), /Se acabó el tiempo/);
});

test('economyboard y economyinfo', async () => {
    const [a, b] = [newJid(), newJid()];
    await setWallet(a, 9_000_000_000, 1);
    await setWallet(b, 100, 50);
    const board = await run(cmd.board, a, '!economyboard');
    assert.match(board, /Ranking de economía/);
    assert.ok(board.indexOf(a.split('@')[0]) < (board.indexOf(b.split('@')[0]) === -1 ? Infinity : board.indexOf(b.split('@')[0])));
    assert.match(await run(cmd.board, a, '!economyboard 9999'), /No hay página/);
    const info = await run(cmd.info, b, '!einfo');
    assert.match(info, /Billetera: \$100/);
    assert.match(info, /Banco: \$50/);
    assert.match(info, /Vida: 100\/100/);
    assert.match(await run(cmd.info, a, '!einfo'), /Puesto: #1 de/);
});
