const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

console.log = () => {};
delete process.env.DATABASE_URL;
process.env.YUKI_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'yuki-mdl-'));

const db = require('../database/db');
const economy = require('../utils/economy');
const M = require('../utils/marriage');
const { addPendingDuel } = require('../utils/pendingDuels');
const marry = require('../commands/general/marry');
const aceptar = require('../commands/general/aceptar');
const rechazar = require('../commands/general/rechazar');
const divorce = require('../commands/general/divorce');

test.after(() => new Promise(resolve => db.close(resolve)));

const GROUP = '120363000000000088@g.us';
let counter = 0;
const newJid = () => `57333${String(1000000 + (counter += 1))}@s.whatsapp.net`;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function fakeSock() {
    const sent = [];
    return { sent, user: { id: '573000000000:1@s.whatsapp.net' }, sendMessage: async (chat, content) => { sent.push(content); return { key: { id: 'X' } }; } };
}
function msg(text, from, { mentioned, quotedId } = {}) {
    const contextInfo = {};
    if (mentioned) contextInfo.mentionedJid = [mentioned];
    if (quotedId) contextInfo.stanzaId = quotedId;
    return { key: { remoteJid: GROUP, participant: from, id: 'M1' }, message: { extendedTextMessage: { text, contextInfo } } };
}
async function say(command, sock, text, from, options) {
    const before = sock.sent.length;
    await command.execute(sock, msg(text, from, options), [], '!');
    for (let i = 0; i < 100 && sock.sent.length === before; i += 1) await sleep(10);
    return sock.sent.at(-1);
}
const setWallet = async (jid, wallet) => { await economy.ensureUser(jid); await economy.run('UPDATE users SET wallet = ? WHERE jid = ?', [wallet, jid]); };

test('matrimonio: propuesta, rechazo, aceptación y divorcio siguen funcionando', async () => {
    const sock = fakeSock();
    const a = newJid(), b = newJid(), c = newJid();
    assert.match((await say(marry, sock, '!marry @b', a, { mentioned: b })).text, /propuso matrimonio/);
    assert.match((await say(rechazar, sock, '!rechazar', b)).text, /rechazó/);
    assert.match((await say(aceptar, sock, '!aceptar', b)).text, /No tienes propuestas/);

    await say(marry, sock, '!marry @b', a, { mentioned: b });
    assert.match((await say(aceptar, sock, '!aceptar', c)).text, /No tienes propuestas/); // un tercero no puede aceptar
    assert.match((await say(aceptar, sock, '!aceptar', b)).text, /casados/);
    assert.equal(M.partnerOf(await M.getUser(a)), b);
    assert.match((await say(divorce, sock, '!divorce', a)).text, /se divorció/);
    assert.equal(M.partnerOf(await M.getUser(b)), null);
});

test('los duelos se siguen aceptando y rechazando con !aceptar / !rechazar', async () => {
    const sock = fakeSock();
    const challenger = newJid(), opponent = newJid();
    await setWallet(challenger, 1000);
    await setWallet(opponent, 1000);

    addPendingDuel({ id: 'DUEL1', chatJid: GROUP, challenger, opponent, amount: 400, sock, challengeKey: { remoteJid: GROUP, id: 'DUEL1' } });
    const accepted = await say(aceptar, sock, '!aceptar', opponent, { quotedId: 'DUEL1' });
    assert.ok(accepted, 'el duelo respondió algo');
    const total = (await economy.getWallet(challenger)) + (await economy.getWallet(opponent));
    assert.equal(total, 2000);
    assert.ok([600, 1400].includes(await economy.getWallet(challenger)), 'el perdedor pagó la apuesta');

    addPendingDuel({ id: 'DUEL2', chatJid: GROUP, challenger, opponent, amount: 100, sock, challengeKey: { remoteJid: GROUP, id: 'DUEL2' } });
    const before = await economy.getWallet(challenger);
    assert.match((await say(rechazar, sock, '!rechazar', opponent, { quotedId: 'DUEL2' })).text, /rechazó el reto/);
    assert.equal(await economy.getWallet(challenger), before);

    assert.match((await say(aceptar, sock, '!aceptar', opponent, { quotedId: 'NOEXISTE' })).text, /no existe o ya expiró/);
});
