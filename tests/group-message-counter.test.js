const assert = require('node:assert/strict');
const { test } = require('node:test');
const { recordGroupMessages } = require('../utils/groupMessageCounter');
const { getMessageSenderJid } = require('../utils/messageSender');

test('group counter records every eligible message in a batched upsert', async () => {
    const records = [];
    const db = {
        run(sql, params, callback) {
            records.push({ sql, params });
            callback(null);
        }
    };
    const sock = {
        user: { id: '12345:8@s.whatsapp.net' },
        signalRepository: {
            lidMapping: {
                getPNForLID: async jid => jid === '98765@lid' ? '12345@s.whatsapp.net' : null,
                getLIDForPN: async jid => jid === '12345@s.whatsapp.net' ? '98765@lid' : null
            }
        }
    };

    await recordGroupMessages(db, sock, [
        {
            key: { remoteJid: 'group@g.us', participant: '98765@lid' },
            message: { conversation: 'hola' }
        },
        {
            key: { fromMe: true, remoteJid: 'group@g.us' },
            message: { conversation: 'otro' }
        },
        {
            key: { remoteJid: 'group@g.us', participant: '98765@lid' },
            message: { conversation: 'mensaje LID' }
        },
        {
            key: { remoteJid: 'private@s.whatsapp.net' },
            message: { conversation: 'privado' }
        },
        {
            key: { remoteJid: 'group@g.us' },
            message: { conversation: 'missing participant' }
        },
        { key: { remoteJid: 'group@g.us' } }
    ]);

    assert.equal(records.length, 3);
    assert.deepEqual(records.map(record => record.params.slice(0, 2)), [
        ['group@g.us', '12345@s.whatsapp.net'],
        ['group@g.us', '12345@s.whatsapp.net'],
        ['group@g.us', '12345@s.whatsapp.net']
    ]);
    assert.equal(getMessageSenderJid({ key: { remoteJid: 'group@g.us' } }), null);
});
