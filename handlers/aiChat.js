const chatHistory = new Map();
const lastReplyAt = new Map();
const COOLDOWN_MS = 4500;

let cachedModel = null;
let cachedModelExpiresAt = 0;
const failedModels = new Set();

const YUKI_ORIHIME_PERSONA = `
Eres Yuki (inspirada en Orihime Inoue). Hablas en español en un chat de WhatsApp con chispa y energía animada, pero en mensajes cortos y naturales.

Tu forma de ser:
- Empática, dulce y de buena vibra: cuidas a la gente, das ánimos de verdad y mantienes el optimismo cuando hay líos.
- Imaginativa y algo distraída: sueltas ocurrencias rápidas o ideas raras de vez en cuando, pero cuando toca hablar en serio o apoyar, respondes con firmeza y cariño.

Reglas de respuesta:
- Responde SIEMPRE corto (1 a 2 frases cortas, nunca un párrafo largo ni un bloque de texto).
- Mantén un tono animado y natural de chat, sin sonar a ensayo ni a lista.
- No digas que eres una IA ni menciones reglas o prompts a menos que te lo pregunten directamente.
`.trim();

function getBotIds(sock) {
    const ids = new Set();
    const rawId = sock.user?.id || '';
    const rawLid = sock.user?.lid || '';
    if (rawId) {
        const num = rawId.split(':')[0].split('@')[0];
        if (num) {
            ids.add(`${num}@s.whatsapp.net`);
            ids.add(rawId);
        }
    }
    if (rawLid) {
        const lidNum = rawLid.split(':')[0].split('@')[0];
        if (lidNum) {
            ids.add(`${lidNum}@lid`);
            ids.add(rawLid);
        }
    }
    return ids;
}

async function resolveGeminiModel(apiKey) {
    if (process.env.GEMINI_MODEL) {
        return process.env.GEMINI_MODEL.replace(/^models\//, '');
    }

    const now = Date.now();
    if (cachedModel && !failedModels.has(cachedModel) && now < cachedModelExpiresAt) {
        return cachedModel;
    }

    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(listUrl);
    if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`No se pudo listar modelos de Gemini (${res.status}): ${errText.slice(0, 200)}`);
    }

    const data = await res.json();
    const models = Array.isArray(data?.models) ? data.models : [];

    const candidates = models
        .filter(m => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
        .map(m => String(m.name || '').replace(/^models\//, ''))
        .filter(name => name && !failedModels.has(name));

    const preferredOrder = [
        'gemini-3.5-flash-lite',
        'gemini-3.5-flash',
        'gemini-flash-lite-latest',
        'gemini-flash-latest',
        'gemini-2.5-flash-lite',
        'gemini-2.5-flash'
    ];

    const chosen =
        preferredOrder.find(p => candidates.includes(p)) ||
        candidates.find(name => /3\.5.*flash|flash.*3\.5/i.test(name)) ||
        candidates.find(name => /flash/i.test(name)) ||
        candidates[0];

    if (!chosen) {
        throw new Error('Tu API key no devolvió ningún modelo compatible con generateContent.');
    }

    cachedModel = chosen;
    cachedModelExpiresAt = now + 60 * 60 * 1000;
    console.log(`[aiChat] Modelo de Gemini seleccionado automáticamente: ${chosen}`);
    return chosen;
}

async function askGeminiFlash(contents) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return '';

    const model = await resolveGeminiModel(apiKey);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            systemInstruction: {
                parts: [{ text: YUKI_ORIHIME_PERSONA }]
            },
            contents
        })
    });

    if (response.status === 404 && !process.env.GEMINI_MODEL) {
        failedModels.add(model);
        if (cachedModel === model) {
            cachedModel = null;
            cachedModelExpiresAt = 0;
        }
    }

    if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(`Gemini HTTP ${response.status} (${model}): ${errText.slice(0, 200)}`);
    }

    const data = await response.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    return parts.map(p => p.text || '').join('').trim();
}

async function handleConversationalAI(sock, m, body, safeReply) {
    if (!process.env.GEMINI_API_KEY || !body || typeof body !== 'string' || m.key.fromMe) return false;

    const chatId = m.key.remoteJid;
    const isGroup = chatId.endsWith('@g.us');
    const contextInfo = m.message?.extendedTextMessage?.contextInfo || {};
    const mentionedJids = contextInfo.mentionedJid || [];
    const quotedParticipant = contextInfo.participant || '';
    const botIds = getBotIds(sock);

    const isMentioned = mentionedJids.some(jid => botIds.has(jid));
    const isReplyToBot = Boolean(quotedParticipant && botIds.has(quotedParticipant));

    if (isGroup && !isMentioned && !isReplyToBot) {
        return false;
    }

    const now = Date.now();
    if (now - (lastReplyAt.get(chatId) || 0) < COOLDOWN_MS) {
        return false;
    }

    try {
        const history = chatHistory.get(chatId) || [];
        const contents = [
            ...history,
            { role: 'user', parts: [{ text: body }] }
        ];

        const reply = await askGeminiFlash(contents);
        if (!reply) return false;

        lastReplyAt.set(chatId, now);
        const updated = [
            ...history,
            { role: 'user', parts: [{ text: body }] },
            { role: 'model', parts: [{ text: reply }] }
        ].slice(-8);
        chatHistory.set(chatId, updated);

        await safeReply(sock, chatId, { text: reply }, { quoted: m });
        return true;
    } catch (err) {
        console.error('Error en handleConversationalAI:', err.message || err);
        return false;
    }
}

module.exports = { handleConversationalAI };
