const assert = require('node:assert/strict');
const { test } = require('node:test');
const db = require('../database/db');
const pinterest = require('../utils/imageSearch');
const activeSpawns = require('../utils/gachaSpawns');

test('gacha roll searches Pinterest instead of using a legacy catalog image URL', async t => {
    const originalAll = db.all;
    const originalRun = db.run;
    const originalSearch = pinterest.searchPinterestImage;
    const records = [];
    const imageBytes = Buffer.from('pinterest image');
    let searchQuery;
    let resolveSaved;
    const savedPromise = new Promise(resolve => {
        resolveSaved = resolve;
    });

    db.all = (sql, params, callback) => {
        callback(null, [{
            id: 21,
            name: 'Special Week',
            serie: 'Uma Musume: Pretty Derby',
            price: 1000,
            image_url: 'https://legacy.example/script-image.jpg'
        }]);
    };
    db.run = (sql, params, callback) => {
        records.push({ sql, params });
        callback?.(null);
        resolveSaved();
    };
    pinterest.searchPinterestImage = async query => {
        searchQuery = query;
        return { buffer: imageBytes, url: 'https://i.pinimg.com/originals/new-image.jpg' };
    };
    t.after(() => {
        db.all = originalAll;
        db.run = originalRun;
        pinterest.searchPinterestImage = originalSearch;
        activeSpawns.delete('group@g.us');
    });

    const sent = [];
    require('../commands/gacha/roll').execute({
        sendMessage: async (jid, content) => {
            sent.push({ jid, content });
        }
    }, {
        key: { remoteJid: 'group@g.us' }
    });
    await savedPromise;

    assert.equal(searchQuery, 'Special Week Uma Musume: Pretty Derby anime character');
    assert.deepEqual(sent[0].content.image, imageBytes);
    assert.notEqual(sent[0].content.image.url, 'https://legacy.example/script-image.jpg');
    assert.equal(activeSpawns.get('group@g.us').image_url, 'https://i.pinimg.com/originals/new-image.jpg');
    assert.deepEqual(records[0].params, ['https://i.pinimg.com/originals/new-image.jpg', 21]);
});
