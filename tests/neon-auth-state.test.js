const assert = require('node:assert/strict');
const { test } = require('node:test');
const { proto } = require('@whiskeysockets/baileys');
const { createNeonAuthState } = require('../utils/neonAuthState');

const encryptionKey = 'a'.repeat(64);

function createMemoryPool() {
    const values = new Map();
    return {
        values,
        async query(sql, params = []) {
            if (sql.includes('CREATE TABLE IF NOT EXISTS')) return { rows: [] };
            if (sql.includes('SELECT encrypted_value')) {
                const encryptedValue = values.get(params[0]);
                return { rows: encryptedValue ? [{ encrypted_value: encryptedValue }] : [] };
            }
            if (sql.includes('INSERT INTO')) {
                values.set(params[0], params[1]);
                return { rows: [] };
            }
            if (sql.includes('DELETE FROM')) {
                values.delete(params[0]);
                return { rows: [] };
            }
            throw new Error(`Unexpected SQL in test: ${sql}`);
        }
    };
}

test('Neon auth state persists encrypted credentials and Signal keys', async () => {
    const pool = createMemoryPool();
    const auth = await createNeonAuthState(pool, encryptionKey);

    auth.state.creds.me = { id: '15551234567@s.whatsapp.net' };
    auth.state.creds.advSecretKey = 'private-session-secret';
    await auth.saveCreds();
    await auth.state.keys.set({
        'pre-key': {
            '1': { private: Buffer.from('private-key'), public: Buffer.from('public-key') }
        },
        'app-state-sync-key': {
            'sync-1': proto.Message.AppStateSyncKeyData.fromObject({
                keyData: Buffer.from('app-state-key')
            })
        }
    });

    assert.ok(pool.values.has('creds'));
    assert.ok(!pool.values.get('creds').includes('private-session-secret'));
    assert.ok(!pool.values.get('pre-key-1').includes('private-key'));

    const restored = await createNeonAuthState(pool, encryptionKey);
    assert.equal(restored.state.creds.me.id, '15551234567@s.whatsapp.net');
    assert.equal(restored.state.creds.advSecretKey, 'private-session-secret');

    const keys = await restored.state.keys.get('pre-key', ['1']);
    assert.deepEqual(keys['1'].private, Buffer.from('private-key'));
    assert.deepEqual(keys['1'].public, Buffer.from('public-key'));
    const appStateKeys = await restored.state.keys.get('app-state-sync-key', ['sync-1']);
    assert.ok(appStateKeys['sync-1'] instanceof proto.Message.AppStateSyncKeyData);
    assert.deepEqual(appStateKeys['sync-1'].keyData, Buffer.from('app-state-key'));

    await restored.state.keys.set({
        'pre-key': { '1': null },
        'app-state-sync-key': { 'sync-1': null }
    });
    assert.deepEqual(await restored.state.keys.get('pre-key', ['1']), { '1': null });
});

test('Neon auth state rejects malformed encryption keys and tampered values', async () => {
    const pool = createMemoryPool();
    await assert.rejects(createNeonAuthState(pool, 'not-a-key'), /64-character hexadecimal key/);

    const auth = await createNeonAuthState(pool, encryptionKey);
    await auth.state.keys.set({ 'pre-key': { '1': { private: Buffer.from('secret') } } });
    pool.values.set('pre-key-1', 'invalid.encrypted.data');

    const restored = await createNeonAuthState(pool, encryptionKey);
    await assert.rejects(restored.state.keys.get('pre-key', ['1']));
});
