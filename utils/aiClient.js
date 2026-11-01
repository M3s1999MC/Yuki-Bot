require('./loadEnv')();

function getOpenAICompatibleEndpoint() {
    const url = new URL(process.env.AI_API_URL || 'https://openrouter.ai/api/v1/chat/completions');
    if (/\/api\/v1\/?$/.test(url.pathname)) {
        url.pathname = `${url.pathname.replace(/\/$/, '')}/chat/completions`;
    }
    return url;
}

async function askAI(prompt, { system = 'Responde en español, con claridad y brevedad.' } = {}) {
    const apiKey = process.env.AI_API_KEY;
    if (apiKey) {
        const endpoint = getOpenAICompatibleEndpoint();
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: process.env.AI_MODEL || 'openrouter/free',
                messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }],
                temperature: 0.8
            }),
            signal: AbortSignal.timeout(30_000)
        });
        if (!response.ok) throw new Error(`El endpoint de IA respondió HTTP ${response.status}.`);
        const json = await response.json();
        const text = json?.choices?.[0]?.message?.content || json?.output_text || json?.response || json?.text;
        if (typeof text !== 'string' || !text.trim()) throw new Error('El endpoint de IA devolvió una respuesta vacía.');
        return text.trim();
    }

    // Respaldo público ya utilizado por Yuki; puede no estar disponible en todos los entornos.
    const url = new URL('https://api.siputzx.my.id/api/ai/chatgpt');
    url.searchParams.set('query', `${system}\n\n${prompt}`);
    const response = await fetch(url, { signal: AbortSignal.timeout(25_000) });
    if (!response.ok) throw new Error(`El servicio de respaldo respondió HTTP ${response.status}.`);
    const json = await response.json();
    const text = json?.data || json?.result || json?.response || json?.message;
    if (typeof text !== 'string' || !text.trim()) throw new Error('El servicio de respaldo devolvió una respuesta vacía.');
    return text.trim();
}

module.exports = { askAI };
