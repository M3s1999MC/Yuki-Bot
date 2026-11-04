const assert = require('node:assert/strict');
const Module = require('node:module');
const { test } = require('node:test');

const db = {};
const dbModulePath = require.resolve('../database/db');
const mockDbModule = new Module(dbModulePath);
mockDbModule.exports = db;
mockDbModule.loaded = true;
require.cache[dbModulePath] = mockDbModule;

const crime = require('../commands/economy/crime');

test('crime updates wallet for wins and clamps fines to the available balance', async () => {
    const originalGetSafeUser = db.getSafeUser;
    const originalRun = db.run;
    const originalRandom = Math.random;
    const sender = '12345@s.whatsapp.net';

    try {
        for (const scenario of [
            { wallet: 0, randomValues: [0.9, 0.2], change: 600, message: /Ganaste \*\+\$600\*/ },
            { wallet: 500, randomValues: [0.1, 0.5], change: -500, message: /perdiste \*\$500\*/ }
        ]) {
            const messages = [];
            const randomValues = [...scenario.randomValues];
            let update;
            db.getSafeUser = (jid, callback) => {
                assert.equal(jid, sender);
                callback(null, { wallet: scenario.wallet });
            };
            db.run = (sql, params, callback) => {
                update = { sql, params };
                callback(null);
            };
            Math.random = () => randomValues.shift();

            const sock = {
                sendMessage: async (jid, message) => messages.push(message.text)
            };
            const message = { key: { remoteJid: sender, fromMe: false } };

            await crime.execute(sock, message, []);

            assert.match(update.sql, /wallet = CASE/);
            assert.deepEqual(update.params, [scenario.change, scenario.change, sender]);
            assert.match(messages[0], scenario.message);
        }
    } finally {
        db.getSafeUser = originalGetSafeUser;
        db.run = originalRun;
        Math.random = originalRandom;
    }
});
