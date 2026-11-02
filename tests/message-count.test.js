const assert = require('node:assert/strict');
const { test } = require('node:test');
const { getMessageCountTargetJid, getMessageSenderJid } = require('../utils/messageSender');

test('outgoing group messages are counted under the linked WhatsApp account', () => {
    const message = {
        key: { fromMe: true, remoteJid: 'group@g.us' }
    };

    assert.equal(
        getMessageSenderJid(message, { user: { id: '12345:8@s.whatsapp.net' } }),
        '12345@s.whatsapp.net'
    );
    assert.equal(
        getMessageCountTargetJid(message, { user: { id: '12345:8@s.whatsapp.net' } }),
        '12345@s.whatsapp.net'
    );
});

test('message count target honors explicit mentions and quoted participants', () => {
    const message = {
        key: { fromMe: true, remoteJid: 'group@g.us' },
        message: {
            extendedTextMessage: {
                contextInfo: {
                    mentionedJid: ['67890:3@s.whatsapp.net'],
                    participant: '11111@s.whatsapp.net'
                }
            }
        }
    };
    const sock = { user: { id: '12345@s.whatsapp.net' } };

    assert.equal(getMessageCountTargetJid(message, sock), '67890@s.whatsapp.net');
    delete message.message.extendedTextMessage.contextInfo.mentionedJid;
    assert.equal(getMessageCountTargetJid(message, sock), '11111@s.whatsapp.net');
});
