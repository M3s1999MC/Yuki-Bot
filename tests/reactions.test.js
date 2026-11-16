const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = require('../utils/reactions');

const animeDir = path.join(__dirname, '..', 'commands', 'anime');
const GROUP = '120363000000000099@g.us';
const A = '573001111111@s.whatsapp.net';
const B = '573002222222@s.whatsapp.net';

function msg(from, mentioned) {
    const contextInfo = mentioned ? { mentionedJid: [mentioned] } : {};
    return { key: { remoteJid: GROUP, participant: from }, message: { extendedTextMessage: { text: '!x', contextInfo } } };
}
function fakeSock() {
    const sent = [];
    return { sent, sendMessage: async (chat, content) => { sent.push(content); } };
}

test('cada reacción tiene su archivo y nombres y alias no se repiten', () => {
    const files = fs.readdirSync(animeDir).filter(name => name.endsWith('.js')).map(name => name.slice(0, -3)).sort();
    assert.deepEqual(files, R.REACTIONS.map(item => item.key).sort());
    const seen = new Map();
    for (const item of R.REACTIONS) {
        for (const name of [item.key, ...item.aliases]) {
            assert.ok(!seen.has(name), `"${name}" repetido en ${seen.get(name)} y ${item.key}`);
            seen.set(name, item.key);
        }
    }
    for (const file of files) {
        const command = require(path.join(animeDir, file));
        assert.equal(command.name, file);
        assert.equal(typeof command.execute, 'function');
        assert.equal(command.category, 'anime');
    }
});

test('texto sin objetivo, con objetivo y sin auto-mención', async () => {
    const hug = R.makeReaction('happy', { fetchImpl: async () => { throw new Error('sin red'); } });
    const solo = fakeSock();
    await hug.execute(solo, msg(A), []);
    assert.match(solo.sent[0].text, /@573001111111 está feliz/);
    assert.deepEqual(solo.sent[0].mentions, [A]);

    const duo = fakeSock();
    await hug.execute(duo, msg(A, B), []);
    assert.match(duo.sent[0].text, /@573001111111 está feliz con @573002222222/);
    assert.deepEqual(duo.sent[0].mentions, [A, B]);

    const self = fakeSock();
    await hug.execute(self, msg(A, A), []);
    assert.doesNotMatch(self.sent[0].text, / con @/);
    assert.deepEqual(self.sent[0].mentions, [A]);
});

test('con GIF disponible se envía como video animado con el texto de pie', async () => {
    const calls = [];
    const fetchImpl = async url => {
        calls.push(url);
        if (url.startsWith('https://nekos.best/')) {
            return { ok: true, json: async () => ({ results: [{ url: 'https://cdn.example/cry.gif' }] }) };
        }
        return { ok: true, arrayBuffer: async () => new Uint8Array([71, 73, 70]).buffer };
    };
    const command = R.makeReaction('cry', { fetchImpl, convert: async buffer => Buffer.concat([Buffer.from('MP4'), buffer]) });
    const sock = fakeSock();
    await command.execute(sock, msg(A, B), []);
    assert.equal(sock.sent.length, 1);
    assert.equal(sock.sent[0].gifPlayback, true);
    assert.ok(Buffer.isBuffer(sock.sent[0].video));
    assert.match(sock.sent[0].caption, /llora por @573002222222/);
    assert.ok(calls[0].startsWith('https://nekos.best/api/v2/cry'));
});

test('si la API, la descarga o la conversión fallan, igual responde con texto', async () => {
    const failing = [
        async () => { throw new Error('sin red'); },
        async () => ({ ok: false, status: 503 }),
        async url => (url.includes('nekos') ? { ok: true, json: async () => ({ results: [] }) } : { ok: false })
    ];
    for (const fetchImpl of failing) {
        const sock = fakeSock();
        await R.makeReaction('dance', { fetchImpl }).execute(sock, msg(A), []);
        assert.equal(sock.sent.length, 1);
        assert.match(sock.sent[0].text, /baila/);
        assert.equal(sock.sent[0].video, undefined);
    }
    const noFfmpeg = async url => (url.includes('nekos')
        ? { ok: true, json: async () => ({ results: [{ url: 'https://x/y.gif' }] }) }
        : { ok: true, arrayBuffer: async () => new Uint8Array([1]).buffer });
    const sock = fakeSock();
    await R.makeReaction('dance', { fetchImpl: noFfmpeg, convert: async () => null }).execute(sock, msg(A), []);
    assert.match(sock.sent[0].text, /baila/);
});

test('las reacciones sin GIF (solo texto) no consultan la red', async () => {
    let called = false;
    const sock = fakeSock();
    await R.makeReaction('clap', { fetchImpl: async () => { called = true; throw new Error('no debería'); } }).execute(sock, msg(A, B), []);
    assert.equal(called, false);
    assert.match(sock.sent[0].text, /aplaude a @573002222222/);
});

test('si el envío del video falla, se manda el texto', async () => {
    const fetchImpl = async url => (url.includes('nekos')
        ? { ok: true, json: async () => ({ results: [{ url: 'https://x/y.gif' }] }) }
        : { ok: true, arrayBuffer: async () => new Uint8Array([1]).buffer });
    const sent = [];
    const sock = { sendMessage: async (chat, content) => { if (content.video) throw new Error('rechazado'); sent.push(content); } };
    await R.makeReaction('laugh', { fetchImpl, convert: async b => b }).execute(sock, msg(A), []);
    assert.match(sent[0].text, /se ríe/);
});
