const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

console.log = () => {};
delete process.env.DATABASE_URL;
process.env.YUKI_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'yuki-biz-'));

const db = require('../database/db');
const economy = require('../utils/economy');
const biz = require('../utils/businesses');
const missions = require('../utils/missions');
const cmd = {
    negocio: require('../commands/economy/negocio'),
    negocios: require('../commands/economy/negocios'),
    minegocios: require('../commands/economy/minegocios'),
    ngreclamar: require('../commands/economy/ngreclamar'),
    ngpagar: require('../commands/economy/ngpagar'),
    emisiones: require('../commands/economy/emisiones'),
    cofre: require('../commands/economy/cofre'),
    uber: require('../commands/economy/uber')
};

test.after(() => new Promise(resolve => db.close(resolve)));

let counter = 0;
const newJid = () => `57311${String(1000000 + (counter += 1))}@s.whatsapp.net`;
const setWallet = async (jid, wallet) => {
    await economy.ensureUser(jid);
    await economy.run('UPDATE users SET wallet = ?, bank = 0 WHERE jid = ?', [wallet, jid]);
};
const wallet = jid => economy.getWallet(jid);

function msg(jid) {
    return { key: { remoteJid: '120363000000000001@g.us', participant: jid }, message: { conversation: 'x' } };
}
async function run(command, jid, args = []) {
    const sent = [];
    const sock = { sendMessage: async (chat, content) => { sent.push(content.text); } };
    await command.execute(sock, msg(jid), args, '!');
    return sent.join('\n');
}

const arepas = biz.BUSINESSES[0];
const HOUR = biz.HOUR;

test('catálogo: precios crecientes y mantenimiento del 10 %', () => {
    assert.equal(biz.BUSINESSES.length, 6);
    for (let i = 1; i < biz.BUSINESSES.length; i += 1) assert.ok(biz.BUSINESSES[i].price > biz.BUSINESSES[i - 1].price);
    assert.equal(arepas.upkeep, 500);
    assert.equal(biz.findBusiness('1').id, 'arepas');
    assert.equal(biz.findBusiness('Hotel').id, 'hotel');
    assert.equal(biz.findBusiness('nada'), null);
});

test('pendingIncome: por horas, tope 24 h y se detiene al vencer el mantenimiento', () => {
    const t0 = 1_000_000;
    const row = { last_collect: t0, paid_until: t0 + 7 * 24 * HOUR };
    assert.equal(biz.pendingIncome(arepas, row, t0 + 2 * HOUR), 300);
    assert.equal(biz.pendingIncome(arepas, row, t0 + 100 * HOUR), 24 * 150);
    assert.equal(biz.pendingIncome(arepas, { last_collect: t0, paid_until: t0 + 3 * HOUR }, t0 + 50 * HOUR), 450);
    assert.equal(biz.pendingIncome(arepas, row, t0 - 5), 0);
});

test('comprar: sin fondos no cobra, con fondos descuenta una vez y no permite repetir', async () => {
    const jid = newJid();
    await setWallet(jid, 1000);
    assert.deepEqual(await biz.buy(jid, arepas), { ok: false, reason: 'funds' });
    assert.equal(await wallet(jid), 1000);

    await setWallet(jid, 6000);
    assert.deepEqual(await biz.buy(jid, arepas), { ok: true });
    assert.equal(await wallet(jid), 1000);
    assert.deepEqual(await biz.buy(jid, arepas), { ok: false, reason: 'owned' });
    assert.equal(await wallet(jid), 1000);
});

test('cobrar: paga lo acumulado y un segundo cobro inmediato no paga nada', async () => {
    const jid = newJid();
    await setWallet(jid, 5000);
    const t0 = 5_000_000;
    await biz.buy(jid, arepas, t0);
    const first = await biz.collectAll(jid, t0 + 4 * HOUR);
    assert.equal(first.total, 600);
    assert.equal(await wallet(jid), 600);
    const second = await biz.collectAll(jid, t0 + 4 * HOUR);
    assert.equal(second.total, 0);
    assert.equal(await wallet(jid), 600);
});

test('mantenimiento: extiende 7 días, se limita a 4 semanas y recupera lo pendiente si estaba vencido', async () => {
    const jid = newJid();
    await setWallet(jid, 20000);
    const t0 = 9_000_000;
    await biz.buy(jid, arepas, t0);

    // Vence a los 7 días; a los 10 días paga: recupera 24 h de ganancia (tope) y reinicia el reloj.
    const later = t0 + 10 * 24 * HOUR;
    const paid = await biz.payUpkeep(jid, arepas, later);
    assert.equal(paid.ok, true);
    assert.equal(paid.paidUntil, later + 7 * 24 * HOUR);
    assert.equal(paid.recovered, 24 * 150);

    // Pagar de nuevo suma otra semana; se puede adelantar hasta 4 semanas en total (7, 14, 21 y 28 días).
    assert.equal((await biz.payUpkeep(jid, arepas, later)).ok, true);
    assert.equal((await biz.payUpkeep(jid, arepas, later)).ok, true);
    assert.equal((await biz.payUpkeep(jid, arepas, later)).ok, true);
    assert.deepEqual(await biz.payUpkeep(jid, arepas, later), { ok: false, reason: 'too-early' });
});

test('mantenimiento: sin dinero no cambia nada', async () => {
    const jid = newJid();
    await setWallet(jid, 5000);
    await biz.buy(jid, arepas, 1);
    const before = await economy.get('SELECT paid_until FROM user_businesses WHERE user_jid = ?', [jid]);
    assert.equal((await biz.payUpkeep(jid, arepas, 2)).reason, 'funds');
    const after = await economy.get('SELECT paid_until FROM user_businesses WHERE user_jid = ?', [jid]);
    assert.equal(after.paid_until, before.paid_until);
});

test('comandos de negocios: flujo completo', async () => {
    const jid = newJid();
    await setWallet(jid, 5000);
    assert.match(await run(cmd.negocios, jid), /Puesto de arepas/);
    assert.match(await run(cmd.negocio, jid), /Indica qué negocio/);
    assert.match(await run(cmd.negocio, jid, ['1']), /Compraste/);
    assert.match(await run(cmd.negocio, jid, ['1']), /Ya tienes/);
    assert.match(await run(cmd.negocio, jid, ['6']), /No te alcanza/);
    assert.match(await run(cmd.minegocios, jid), /Por cobrar/);
    assert.match(await run(cmd.ngreclamar, jid), /Aún no hay ganancias/);
    assert.match(await run(cmd.ngpagar, jid), /Mantenimiento/);
    assert.match(await run(cmd.ngpagar, jid, ['4']), /No tienes ese negocio/);
});

test('sin negocios los comandos lo dicen', async () => {
    const jid = newJid();
    assert.match(await run(cmd.minegocios, jid), /no tienes negocios|Todavía no tienes/i);
    assert.match(await run(cmd.ngreclamar, jid), /No tienes negocios/);
    assert.match(await run(cmd.ngpagar, jid), /No tienes negocios/);
});

test('misiones: progreso, tope, cobro único y reinicio por día (hora de Colombia)', async () => {
    const jid = newJid();
    await economy.ensureUser(jid);
    const now = Date.UTC(2026, 10, 12, 15, 0, 0);
    for (let i = 0; i < 5; i += 1) await missions.track(jid, 'trabajos', 1, now);
    await missions.track(jid, 'inexistente', 1, now);
    let list = await missions.status(jid, now);
    assert.equal(list.find(item => item.key === 'trabajos').progress, 3);
    assert.equal(list.find(item => item.key === 'trabajos').done, true);
    assert.equal(list.find(item => item.key === 'cofre').done, false);

    const before = await wallet(jid);
    const first = await missions.claimAll(jid, now);
    assert.deepEqual(first.map(item => item.key), ['trabajos']);
    assert.equal(await wallet(jid), before + 1500);
    assert.deepEqual(await missions.claimAll(jid, now), []);
    assert.equal(await wallet(jid), before + 1500);

    // 04:59 UTC del día siguiente todavía es el mismo día en Colombia; 05:00 UTC ya es otro.
    assert.equal(missions.dayKey(Date.UTC(2026, 10, 13, 4, 59)), '2026-11-12');
    assert.equal(missions.dayKey(Date.UTC(2026, 10, 13, 5, 0)), '2026-11-13');
    list = await missions.status(jid, Date.UTC(2026, 10, 13, 5, 0));
    assert.equal(list.find(item => item.key === 'trabajos').progress, 0);
});

test('los comandos que cuentan para misiones suman progreso solo si funcionan', async () => {
    const jid = newJid();
    await economy.ensureUser(jid);
    await run(cmd.uber, jid);
    await run(cmd.uber, jid); // segunda vez: en espera, no cuenta
    await run(cmd.cofre, jid);
    const list = await missions.status(jid);
    assert.equal(list.find(item => item.key === 'trabajos').progress, 1);
    assert.equal(list.find(item => item.key === 'cofre').progress, 1);
    assert.match(await run(cmd.emisiones, jid, ['cobrar']), /Misiones diarias/);
});
