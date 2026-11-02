const assert = require('node:assert/strict');
const Module = require('node:module');
const { test } = require('node:test');

const db = {};
const dbModulePath = require.resolve('../database/db');
const mockDbModule = new Module(dbModulePath);
mockDbModule.exports = db;
mockDbModule.loaded = true;
require.cache[dbModulePath] = mockDbModule;

const rewards = [
    { command: require('../commands/economy/daily'), cooldownField: 'lastDaily', amount: 1500 },
    { command: require('../commands/economy/weekly'), cooldownField: 'lastWeekly', amount: 10000 },
    { command: require('../commands/economy/monthly'), cooldownField: 'lastMonthly', amount: 50000 }
];

test('daily, weekly, and monthly rewards credit the sender and enforce cooldowns', async () => {
    const originalGetSafeUser = db.getSafeUser;
    const originalRun = db.run;

    try {
        for (const { command, cooldownField, amount } of rewards) {
            const sender = '12345@s.whatsapp.net';
            const messages = [];
            let lastClaim = 0;
            let updateCount = 0;
            db.getSafeUser = (jid, callback) => callback(null, { [cooldownField]: lastClaim });
            db.run = (sql, params, callback) => {
                updateCount += 1;
                assert.match(sql, /UPDATE users SET wallet = wallet \+ \?/);
                assert.equal(params[0], amount);
                assert.equal(params[2], sender);
                callback.call({ changes: 1 }, null);
            };
            const sock = {
                user: { id: '99999@s.whatsapp.net' },
                sendMessage: async (jid, message) => {
                    messages.push(message.text);
                }
            };
            const message = { key: { remoteJid: sender, fromMe: false } };

            await command.execute(sock, message, []);

            assert.equal(updateCount, 1);
            assert.match(messages[0], new RegExp(`\\+\\$${amount.toLocaleString('es-CO')}`));

            lastClaim = Date.now();
            await command.execute(sock, message, []);

            assert.equal(updateCount, 1);
            assert.match(messages[1], /Ya reclamaste tu recompensa/);
        }
    } finally {
        db.getSafeUser = originalGetSafeUser;
        db.run = originalRun;
    }
});
