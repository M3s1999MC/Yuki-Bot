const assert = require('node:assert/strict');
const Module = require('node:module');
const { test } = require('node:test');
const activeSpawns = require('../utils/gachaSpawns');

const db = {};
const dbModulePath = require.resolve('../database/db');
const mockDbModule = new Module(dbModulePath);
mockDbModule.exports = db;
mockDbModule.loaded = true;
require.cache[dbModulePath] = mockDbModule;

const claim = require('../commands/gacha/claim');

test('claim refuses a duplicate and leaves the character available', async t => {
    const originalGetSafeUser = db.getSafeUser;
    const originalRun = db.run;
    const jid = 'group@g.us';
    const sender = '12345@s.whatsapp.net';
    const spawned = {
        name: 'Maki Zenin',
        serie: 'Jujutsu Kaisen',
        image_url: 'https://example.com/maki.jpg',
        price: 2200
    };
    const messages = [];
    activeSpawns.set(jid, spawned);

    db.getSafeUser = (userJid, callback) => callback(null, {});
    db.run = (sql, params, callback) => {
        assert.match(sql, /ON CONFLICT \(owner_jid, character_name, series\) DO NOTHING/);
        assert.deepEqual(params.slice(0, 3), [sender, spawned.name, spawned.serie]);
        callback.call({ changes: 0 }, null);
    };
    t.after(() => {
        db.getSafeUser = originalGetSafeUser;
        db.run = originalRun;
        activeSpawns.delete(jid);
    });

    await claim.execute({
        sendMessage: async (targetJid, content) => messages.push(content.text)
    }, {
        key: { remoteJid: jid, participant: sender },
        message: { extendedTextMessage: { contextInfo: { quotedMessage: {} } } }
    });

    assert.equal(activeSpawns.get(jid), spawned);
    assert.match(messages[0], /Ya tienes a \*Maki Zenin\*/);
});
