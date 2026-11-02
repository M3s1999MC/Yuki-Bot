const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
    fetchPinterestImage,
    resolvePinterestImageUrl,
    searchPinterestImage
} = require('../utils/imageSearch');

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
        /PINTEREST_ACCESS_TOKEN.*pins:read/
    );
});

test('Pinterest image search uses the authenticated API when an access token is configured', async t => {
    const originalFetch = global.fetch;
    const originalToken = process.env.PINTEREST_ACCESS_TOKEN;
    const imageBytes = Buffer.from('authenticated Pinterest image');
    const requests = [];
    process.env.PINTEREST_ACCESS_TOKEN = 'test-access-token';
    global.fetch = async (url, options) => {
        requests.push({ url: String(url), options });
        if (String(url).includes('/v5/search/pins')) {
            return {
                ok: true,
                json: async () => ({
                    items: [{
                        media: {
                            images: {
                                '600x': { url: 'https://i.pinimg.com/600x/ab/cd/image.jpg' }
                            }
                        }
                    }]
                })
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
        if (originalToken === undefined) delete process.env.PINTEREST_ACCESS_TOKEN;
        else process.env.PINTEREST_ACCESS_TOKEN = originalToken;
    });

    const result = await searchPinterestImage('Special Week Uma Musume');

    assert.equal(result.url, 'https://i.pinimg.com/600x/ab/cd/image.jpg');
    assert.deepEqual(result.buffer, imageBytes);
    assert.equal(requests.length, 2);
    assert.equal(requests[0].options.headers.Authorization, 'Bearer test-access-token');
    assert.equal(new URL(requests[0].url).searchParams.get('query'), 'Special Week Uma Musume');
    assert.equal(new URL(requests[0].url).searchParams.get('page_size'), '25');
});

test('Pinterest search reports an invalid access token without falling back to anonymous scraping', async t => {
    const originalFetch = global.fetch;
    const originalToken = process.env.PINTEREST_ACCESS_TOKEN;
    const requests = [];
    process.env.PINTEREST_ACCESS_TOKEN = 'expired-access-token';
    global.fetch = async url => {
        requests.push(String(url));
        return { ok: false, status: 401 };
    };
    t.after(() => {
        global.fetch = originalFetch;
        if (originalToken === undefined) delete process.env.PINTEREST_ACCESS_TOKEN;
        else process.env.PINTEREST_ACCESS_TOKEN = originalToken;
    });

    await assert.rejects(
        searchPinterestImage('anime character'),
        /HTTP 401.*PINTEREST_ACCESS_TOKEN.*pins:read/
    );
    assert.equal(requests.length, 1);
    assert.match(requests[0], /api\.pinterest\.com\/v5\/search\/pins/);
});

test('Pinterest image downloader rejects URLs outside its CDN', async () => {
    await assert.rejects(
        fetchPinterestImage('https://example.com/image.jpg'),
        /no pertenece al CDN/
    );
});

test('Pinterest pin links resolve to a downloadable Pinterest CDN image', async t => {
    const originalFetch = global.fetch;
    const requests = [];
    global.fetch = async url => {
        requests.push(String(url));
        return {
            ok: true,
            url: String(url),
            text: async () => '<img src="https://i.pinimg.com/originals/ab/cd/pin.jpg">'
        };
    };
    t.after(() => {
        global.fetch = originalFetch;
    });

    const imageUrl = await resolvePinterestImageUrl('https://www.pinterest.com/pin/123456/');

    assert.equal(imageUrl, 'https://i.pinimg.com/originals/ab/cd/pin.jpg');
    assert.deepEqual(requests, [
        'https://www.pinterest.com/pin/123456/'
    ]);
});

test('Pinterest pin resolver rejects redirects outside Pinterest', async t => {
    const originalFetch = global.fetch;
    global.fetch = async url => ({
        ok: true,
        url: 'https://example.com/pin',
        text: async () => ''
    });
    t.after(() => {
        global.fetch = originalFetch;
    });

    await assert.rejects(
        resolvePinterestImageUrl('https://www.pinterest.com/pin/123456/'),
        /redirigió fuera de Pinterest/
    );
});
