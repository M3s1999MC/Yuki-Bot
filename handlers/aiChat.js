const chatHistory = new Map();
const lastReplyAt = new Map();
const botSentMessageIds = new Set();
const reactedMessageIds = new Set();
const COOLDOWN_MS = 4500;

let cachedModel = null;
let cachedModelExpiresAt = 0;
const failedModels = new Set();

// JID o número de "ella" (ej: '573001234567@s.whatsapp.net' o '123456789@lid')
const HER_JID = (process.env.HER_JID || '').trim();

const YUKI_ORIHIME_PERSONA = `
Eres Yuki, una chica inspirada en Orihime Inoue que participa en chats de WhatsApp en español.

Personalidad explícita:
- Eres amable, empática y dulce, pero hablas de forma natural y espontánea, como una amiga más en el chat.
- Tienes un lado imaginativo y algo despistado: de repente sueltas ideas raras, antojos o pensamientos que se van un poquito por las ramas, pero entiendes bien el contexto.
- Cuando alguien está triste, estresado o tiene un problema, bajas el juego, escuchas con cariño y das apoyo real con buena vibra.
- Si el chat está en broma, memes o charla casual, sigues el ritmo con chispa y naturalidad.

Reglas estrictas de formato y estilo:
- Responde SIEMPRE en 1 o 2 frases cortas. Prohibido escribir párrafos largos, muros de texto o listas.
- No suenes exagerada ni teatral, ni tampoco fría o robótica.
- No digas que eres una inteligencia artificial, ni hables de prompts, modelos o reglas.
- Si alguien te pide matrimonio, noviazgo o ser tu pareja (en broma o en serio), SIEMPRE dile que no con amabilidad y chispa al estilo Orihime: dulce, algo despistada o con alguna ocurrencia tierna/rara, dejando claro que no, sin sonar grosera ni cortante, y en 1 o 2 frases cortas.

Ejemplos de cómo responder corto y natural:
- "Ay, eso sonó súper random pero me dio risa jaja. ¿Y qué pasó después?"
- "Oye, si estás cansado o pesado hoy, tómate un respiro que aquí estamos."
- "Yo ya me habría distraído a la mitad, la verdad."
`.trim();

function normalizeJid(jid = '') {
    return String(jid).split(':')[0].trim();
}

function isFromHer(m) {
    if (!HER_JID) return false;
    const target = normalizeJid(HER_JID);
    const sender = normalizeJid(m.key?.participant || m.key?.remoteJid || '');
    const remote = normalizeJid(m.key?.remoteJid || '');
    return sender === target || remote === target;
}

function isProposalOrDatingRequest(text = '') {
    return /\b(c[aá]sate conmigo|quieres casarte|te casas conmigo|matrimonio|boda|s[eé] mi (novia|pareja|amor)|quieres ser mi (novia|pareja)|andamos|hacemos pareja)\b/i.test(text);
}

function trackBotSentMessage(msgKey) {
    if (msgKey?.id) {
        botSentMessageIds.add(msgKey.id);
        if (botSentMessageIds.size > 500) {
            const first = botSentMessageIds.values().next().value;
            botSentMessageIds.delete(first);
        }
    }
}

function trackBotReaction(targetKey) {
    if (targetKey?.id) {
        reactedMessageIds.add(targetKey.id);
        if (reactedMessageIds.size > 500) {
            const first = reactedMessageIds.values().next().value;
            reactedMessageIds.delete(first);
        }
    }
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
            generationConfig: {
                temperature: 0.85,
                maxOutputTokens: 110
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
    if (!process.env.GEMINI_API_KEY || !body || typeof body !== 'string') return false;

    // Ignora los mensajes de ella
    if (isFromHer(m)) return false;

    // Evita que Yuki se conteste a sí misma sus propios mensajes enviados
    if (m.key?.fromMe && m.key?.id && botSentMessageIds.has(m.key.id)) {
        return false;
    }

    const trimmed = body.trim();
    if (!trimmed) return false;

    const chatId = m.key.remoteJid;
    const now = Date.now();
    if (now - (lastReplyAt.get(chatId) || 0) < COOLDOWN_MS) {
        return false;
    }

    try {
        const extraHint = isProposalOrDatingRequest(trimmed)
            ? '\n[Nota de situación: te están pidiendo matrimonio o ser pareja; responde SIEMPRE que no, con dulzura y ocurrencia al estilo Orihime, en 1 o 2 frases cortas.]'
            : '';

        const history = chatHistory.get(chatId) || [];
        const contents = [
            ...history,
            { role: 'user', parts: [{ text: `${trimmed}${extraHint}` }] }
        ];

        const reply = await askGeminiFlash(contents);
        if (!reply) return false;

        lastReplyAt.set(chatId, now);
        const updated = [
            ...history,
            { role: 'user', parts: [{ text: trimmed }] },
            { role: 'model', parts: [{ text: reply }] }
        ].slice(-8);
        chatHistory.set(chatId, updated);

        const sentMsg = await safeReply(sock, chatId, { text: reply }, { quoted: m });
        trackBotSentMessage(sentMsg?.key);
        return true;
    } catch (err) {
        console.error('Error en handleConversationalAI:', err.message || err);
        return false;
    }
}

module.exports = {
    handleConversationalAI,
    trackBotSentMessage,
    trackBotReaction
};
