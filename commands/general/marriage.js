const db = require('../database/db');

const SINGLE = 'Nadie 💔';
const proposals = {}; // { destinatario: { from, timer } } en memoria, expiran en 2 min

const getUser = (jid) => new Promise((res, rej) =>
    db.getSafeUser(jid, (err, user) => err ? rej(err) : res(user)));

const setMarried = (jid, value) => new Promise((res, rej) =>
    db.updateUser(jid, { married: value }, (err) => err ? rej(err) : res()));

const partnerOf = (user) =>
    typeof user?.married === 'string' && user.married.includes('@') ? user.married : null;

const getSender = (m) => m.key.participant || m.key.remoteJid;

const getMentioned = (m) => {
    const ctx = m.message?.extendedTextMessage?.contextInfo;
    return ctx?.mentionedJid?.[0] || ctx?.participant || null;
};

const tag = (jid) => '@' + jid.split('@')[0];

module.exports = { SINGLE, proposals, getUser, setMarried, partnerOf, getSender, getMentioned, tag };