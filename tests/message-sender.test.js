const assert = require('node:assert/strict');
const { test } = require('node:test');
const { getBalanceTargetJid, getMessageSenderJid } = require('../utils/messageSender');

test('outgoing private commands are attributed to the bot account, not the chat recipient', () => {
    const message = {
        key: {
            fromMe: true,
            remoteJid: 'friend@s.whatsapp.net'
        }
    };

    assert.equal(
        getMessageSenderJid(message, { user: { id: 'my-account:7@s.whatsapp.net' } }),
        'my-account@s.whatsapp.net'
    );
});

test('incoming group sender prefers the phone JID alternate to the LID', () => {
    const message = {
        key: {
            remoteJid: 'group@g.us',
            participant: 'contact-lid@lid',
            participantAlt: 'contact-phone:4@s.whatsapp.net'
        }
    };

    assert.equal(getMessageSenderJid(message), 'contact-phone@s.whatsapp.net');
});

test('incoming private sender resolves an alternate phone JID when available', () => {
    const message = {
        key: {
            remoteJid: 'contact-lid@lid',
            remoteJidAlt: 'contact-phone@s.whatsapp.net'
        }
    };

    assert.equal(getMessageSenderJid(message), 'contact-phone@s.whatsapp.net');
});

test('balance mention selects the mentioned account even when the command replies to someone', () => {
    const message = {
        key: { remoteJid: 'group@g.us', participant: 'owner@s.whatsapp.net' },
        message: {
            extendedTextMessage: {
                contextInfo: {
                    participant: 'quoted-user@s.whatsapp.net',
                    mentionedJid: ['target-user:3@s.whatsapp.net']
                }
            }
        }
    };

    assert.equal(
        getBalanceTargetJid(message, { user: { id: 'bot@s.whatsapp.net' } }),
        'target-user@s.whatsapp.net'
    );
});
