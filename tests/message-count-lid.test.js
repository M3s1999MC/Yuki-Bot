const assert = require('node:assert/strict');
const { test } = require('node:test');
const { getCanonicalMessageCountJid, getMessageCountJids } = require('../utils/messageSender');

test('LID and phone identities resolve to the same canonical message count key', async () => {
    const lidMessage = {
        key: { remoteJid: 'group@g.us', participant: '98765@lid' }
    };
    const phoneMessage = {
        key: { remoteJid: 'group@g.us', participant: '12345@s.whatsapp.net' }
    };
    const sock = {
        signalRepository: {
            lidMapping: {
                getPNForLID: async jid => jid === '98765@lid' ? '12345@s.whatsapp.net' : null,
                getLIDForPN: async jid => jid === '12345@s.whatsapp.net' ? '98765@lid' : null
            }
        }
    };

    assert.equal(await getCanonicalMessageCountJid(lidMessage, sock), '12345@s.whatsapp.net');
    assert.deepEqual(await getMessageCountJids(lidMessage, sock), [
        '12345@s.whatsapp.net',
        '98765@lid'
    ]);
    assert.deepEqual(await getMessageCountJids(phoneMessage, sock), [
        '12345@s.whatsapp.net',
        '98765@lid'
    ]);
});
