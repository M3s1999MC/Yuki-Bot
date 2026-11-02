const assert = require('node:assert/strict');
const { test } = require('node:test');
const { getWhatsAppInviteUrl } = require('../utils/whatsappInvite');

test('WhatsApp invite URL is stable across device IDs', () => {
    assert.equal(
        getWhatsAppInviteUrl('573001112233:17@s.whatsapp.net'),
        'https://wa.me/573001112233'
    );
});

test('WhatsApp invite URL rejects IDs that are not public phone numbers', () => {
    assert.equal(getWhatsAppInviteUrl('123456@lid'), null);
    assert.equal(getWhatsAppInviteUrl('not-a-number@s.whatsapp.net'), null);
});
