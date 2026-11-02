const assert = require('node:assert/strict');
const Module = require('node:module');
const { test } = require('node:test');
const pinterest = require('../utils/imageSearch');
const activeSpawns = require('../utils/gachaSpawns');

const db = {};
const dbModulePath = require.resolve('../database/db');
const mockDbModule = new Module(dbModulePath);
mockDbModule.exports = db;
mockDbModule.loaded = true;
require.cache[dbModulePath] = mockDbModule;

test('gacha roll uses the configured Pinterest image for a curated character', async t => {
    const originalAll = db.all;
    const originalRun = db.run;
    const originalFetchImage = pinterest.fetchPinterestImage;
    const originalResolveImageUrl = pinterest.resolvePinterestImageUrl;
    const imageBytes = Buffer.from('configured Pinterest image');
    let fetchedUrl;
    let resolvedUrl;
    let query;

    db.all = (sql, params, callback) => {
        query = sql;
        callback(null, [{
            id: 21,
            name: 'Special Week',
            serie: 'Uma Musume: Pretty Derby',
            price: 1000,
            image_url: 'https://www.pinterest.com/pin/123456/'
        }]);
    };
    db.run = () => {
        throw new Error('roll must not change catalog images');
    };
    pinterest.fetchPinterestImage = async url => {
        fetchedUrl = url;
        return imageBytes;
    };
    pinterest.resolvePinterestImageUrl = async url => {
        resolvedUrl = url;
        return 'https://i.pinimg.com/originals/special-week.jpg';
    };
    t.after(() => {
        db.all = originalAll;
        db.run = originalRun;
        pinterest.fetchPinterestImage = originalFetchImage;
        pinterest.resolvePinterestImageUrl = originalResolveImageUrl;
        activeSpawns.delete('group@g.us');
        delete require.cache[require.resolve('../commands/gacha/roll')];
    });

    const sent = [];
    require('../commands/gacha/roll').execute({
        sendMessage: async (jid, content) => {
            sent.push({ jid, content });
        }
    }, {
        key: { remoteJid: 'group@g.us' }
    });

    await new Promise(resolve => setImmediate(resolve));
    assert.match(query, /is_curated = 1/);
    assert.equal(resolvedUrl, 'https://www.pinterest.com/pin/123456/');
    assert.equal(fetchedUrl, 'https://i.pinimg.com/originals/special-week.jpg');
    assert.deepEqual(sent[0].content.image, imageBytes);
    assert.match(sent[0].content.caption, /Special Week/);
    assert.match(sent[0].content.caption, /Uma Musume: Pretty Derby/);
    assert.match(sent[0].content.caption, /1\.000/);
    assert.equal(activeSpawns.get('group@g.us').image_url, 'https://i.pinimg.com/originals/special-week.jpg');
});

test('gacha roll does not spawn a character until an image has been configured', async t => {
    const originalAll = db.all;
    db.all = (sql, params, callback) => callback(null, [{
        name: 'Special Week',
        serie: 'Uma Musume: Pretty Derby',
        image_url: null
    }]);
    t.after(() => {
        db.all = originalAll;
        activeSpawns.delete('group@g.us');
    });

    const sent = [];
    await require('../commands/gacha/roll').execute({
        sendMessage: async (jid, content) => sent.push(content)
    }, {
        key: { remoteJid: 'group@g.us' }
    });

    await new Promise(resolve => setImmediate(resolve));
    assert.match(sent[0].text, /utils\/gachaRoster\.js/);
    assert.equal(activeSpawns.has('group@g.us'), false);
});
