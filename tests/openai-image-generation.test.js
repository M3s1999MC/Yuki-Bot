const assert = require('node:assert/strict');
const { test } = require('node:test');
const { generateOriginalCharacterImage } = require('../utils/openaiImageGeneration');

const originalApiKey = process.env.OPENAI_IMAGE_API_KEY;
const originalOpenAiApiKey = process.env.OPENAI_API_KEY;
const originalModel = process.env.OPENAI_IMAGE_MODEL;
const originalFetch = global.fetch;

function restoreEnvironment() {
    if (originalApiKey === undefined) delete process.env.OPENAI_IMAGE_API_KEY;
    else process.env.OPENAI_IMAGE_API_KEY = originalApiKey;
    if (originalOpenAiApiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalOpenAiApiKey;
    if (originalModel === undefined) delete process.env.OPENAI_IMAGE_MODEL;
    else process.env.OPENAI_IMAGE_MODEL = originalModel;
    global.fetch = originalFetch;
}

test('OpenAI image generation returns the generated image and requests original art', async () => {
    try {
        process.env.OPENAI_IMAGE_API_KEY = 'test-secret';
        process.env.OPENAI_IMAGE_MODEL = 'gpt-image-test';
        let request;
        global.fetch = async (url, options) => {
            request = { url, options };
            return {
                ok: true,
                async json() {
                    return { data: [{ b64_json: Buffer.from('generated-image').toString('base64') }] };
                }
            };
        };

        const image = await generateOriginalCharacterImage({
            name: 'Lumi Aster',
            role: 'star guardian',
            description: 'A traveler protecting distant worlds.',
            design: 'A jade coat and golden eyes.',
            personality: 'Curious and kind.'
        });

        assert.deepEqual(image, Buffer.from('generated-image'));
        assert.equal(request.url, 'https://api.openai.com/v1/images/generations');
        assert.equal(request.options.headers.Authorization, 'Bearer test-secret');
        const body = JSON.parse(request.options.body);
        assert.equal(body.model, 'gpt-image-test');
        assert.equal(body.quality, 'low');
        assert.equal(body.n, 1);
        assert.match(body.prompt, /original design, not based on or resembling any existing character or franchise/);
    } finally {
        restoreEnvironment();
    }
});

test('OpenAI image generation reports a missing API key', async () => {
    try {
        delete process.env.OPENAI_IMAGE_API_KEY;
        delete process.env.OPENAI_API_KEY;
        await assert.rejects(
            generateOriginalCharacterImage({ name: 'Lumi Aster' }),
            /OPENAI_IMAGE_API_KEY/
        );
    } finally {
        restoreEnvironment();
    }
});

test('OpenAI image generation accepts the standard OPENAI_API_KEY variable', async () => {
    try {
        delete process.env.OPENAI_IMAGE_API_KEY;
        process.env.OPENAI_API_KEY = 'standard-test-secret';
        global.fetch = async () => ({
            ok: true,
            async json() {
                return { data: [{ b64_json: Buffer.from('generated-image').toString('base64') }] };
            }
        });

        const image = await generateOriginalCharacterImage({ name: 'Lumi Aster' });

        assert.deepEqual(image, Buffer.from('generated-image'));
    } finally {
        restoreEnvironment();
    }
});

test('OpenAI image generation surfaces API errors without hiding them', async () => {
    try {
        process.env.OPENAI_IMAGE_API_KEY = 'test-secret';
        global.fetch = async () => ({
            ok: false,
            status: 401,
            async json() {
                return { error: { message: 'Invalid API key' } };
            }
        });
        await assert.rejects(
            generateOriginalCharacterImage({ name: 'Lumi Aster' }),
            /Invalid API key/
        );
    } finally {
        restoreEnvironment();
    }
});
