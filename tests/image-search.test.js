const assert = require('node:assert/strict');
const { test } = require('node:test');
const { fetchPinterestImage, searchPinterestImage } = require('../utils/imageSearch');

test('Pinterest image search finds and downloads a public pin image', async t => {
    const originalFetch = global.fetch;
    const imageBytes = Buffer.from('fake image data');
    const requests = [];
    global.fetch = async (url, options) => {
        requests.push({ url: String(url), options });
        if (String(url).includes('/search/pins/')) {
            return {
                ok: true,
                text: async () => '<img src="https://i.pinimg.com/originals/ab/cd/image.jpg">'
            };
        }
        return {
            ok: true,
            headers: {
                get: name => name === 'content-type' ? 'image/jpeg' : String(imageBytes.length)
            },
            arrayBuffer: async () => imageBytes
        };
    };
    t.after(() => {
        global.fetch = originalFetch;
    });

    const result = await searchPinterestImage('Special Week Uma Musume');

    assert.equal(result.url, 'https://i.pinimg.com/originals/ab/cd/image.jpg');
    assert.deepEqual(result.buffer, imageBytes);
    assert.equal(requests.length, 2);
    assert.equal(requests[1].options.headers.Referer, 'https://www.pinterest.com/');
});

test('Pinterest image search ignores a decorative CSS image and selects an actual result', async t => {
    const originalFetch = global.fetch;
    const imageBytes = Buffer.from('fake image data');
    let downloadedUrl;
    global.fetch = async url => {
        if (String(url).includes('/search/pins/')) {
            return {
                ok: true,
                text: async () => [
                    '<style>:root{--logo:url(https://i.pinimg.com/originals/logo.png)}</style>',
                    '<div style="background:url(https://i.pinimg.com/originals/logo.png)}.button_D{">',
                    '<img src="https://i.pinimg.com/originals/ab/cd/image.png">'
                ].join('')
            };
        }
        downloadedUrl = String(url);
        return {
            ok: true,
            headers: {
                get: name => name === 'content-type' ? 'image/png' : String(imageBytes.length)
            },
            arrayBuffer: async () => imageBytes
        };
    };
    t.after(() => {
        global.fetch = originalFetch;
    });

    const result = await searchPinterestImage('K-On anime character');

    assert.equal(result.url, 'https://i.pinimg.com/originals/ab/cd/image.png');
    assert.equal(downloadedUrl, result.url);
});

test('Pinterest search reports when unauthenticated results are locked', async t => {
    const originalFetch = global.fetch;
    global.fetch = async () => ({
        ok: true,
        text: async () => '<style>:root{--logo:url(https://i.pinimg.com/originals/logo.png)}</style>' +
            '"lop_unauth_lockdown_search":"enabled_rollout"'
    });
    t.after(() => {
        global.fetch = originalFetch;
    });

    await assert.rejects(
        searchPinterestImage('anime character'),
        /restringiendo los resultados para búsquedas sin iniciar sesión/
    );
});

test('Pinterest image downloader rejects URLs outside its CDN', async () => {
    await assert.rejects(
        fetchPinterestImage('https://example.com/image.jpg'),
        /no pertenece al CDN/
    );
});
