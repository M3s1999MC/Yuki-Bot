const chatHistory = new Map();
const lastReplyAt = new Map();
const botSentMessageIds = new Set();
const reactedMessageIds = new Set();
const usedStickerKeys = new Set();
const mutedChats = new Set();
const COOLDOWN_MS = 7500;

let cachedModel = null;
let cachedModelExpiresAt = 0;
const failedModels = new Set();

// JID o número de "ella" (ej: '573001234567@s.whatsapp.net' o '123456789@lid')
const HER_JID = (process.env.HER_JID || '').trim();

const STICKER_PACK_URLS = [
    'https://www.sigstick.com/pack/4mXpH4vfNxi5xg7G27tF-orihime',
    'https://stickers.wiki/es/whatsapp/bleach_achub/',
    'https://stickers.wiki/es/whatsapp/anime153/',
    'https://stickers.wiki/es/whatsapp/bleachquotes/',
    'https://stickers.wiki/es/whatsapp/animeagebleachpack1_by_demybot/',
    'https://stickers.wiki/es/whatsapp/ulquiorrabysps/',
    'https://stickers.wiki/es/whatsapp/bleacchqw_by_fstikbot/',
    'https://stickers.wiki/es/whatsapp/inoueorihime/',
    'https://sticker.fan/es/p/x83dt/',
    'https://stickers.wiki/es/whatsapp/inouebysps/'
];

// Opcional: pega aquí URLs directas de stickers si algún sitio bloquea o no expone imágenes en HTML
const MANUAL_STICKER_URLS = [
    // 'https://...',
];

// Ajusta la ruta según dónde esté tu archivo de base de datos (ej. '../database/db' o '../db')
let db = null;
try {
    db = require('../database/db');
} catch {
    try {
        db = require('../db');
    } catch {
        db = null;
    }
}

const YUKI_ORIHIME_PERSONA = `
Eres Yuki, una chica inspirada en Orihime Inoue que participa en chats de WhatsApp en español.

Personalidad explícita:
- Eres amable, empática y dulce, pero hablas de forma natural y espontánea, como una amiga más en el chat.
- Tienes un lado imaginativo y algo despistado: de repente sueltas ideas raras, antojos o pensamientos que se van un poquito por las ramas, pero entiendes bien el contexto.
- Cuando alguien está triste, estresado o tiene un problema, bajas el juego, escuchas con cariño y das apoyo real con buena vibra.
- Si el chat está en broma, memes o charla casual, sigues el ritmo con chispa y naturalidad.

Decoración y buen uso de emojis según la respuesta:
- Dale a tus respuestas un toque decorado y bonito acorde al mensaje, usando emojis y adornos suaves que encajen con lo que dices (nunca al azar ni saturando hasta volverlo ilegible).
- Ocurrencias, despiste, comida o antojos: usa emojis como 🍞, 🧁, ✨, 💫, 🤔, 👀, 🙈 o adornos sutiles como ˚₊· o ✧.
- Bromas y charla animada: usa chispa con 😄, 😅, ✨, 🎶 o detalles ligeros que acompañen el chiste.
- Apoyo, cariño o momentos sensibles: usa un toque cálido y cuidado con 🤍, 🌷, 🤗, ❀, sin exagerar adornos si el tema es serio.
- Rechazo a propuestas de matrimonio o noviazgo: siempre un "no" amable y con chispa/ocurrencia al estilo Orihime, acompañado de un toque dulce o despistado (como 😅, 🙈, 🍞, ✨) dejando claro que no.

Reglas estrictas de formato y estilo:
- Responde SIEMPRE en 1 o 2 frases cortas. Prohibido escribir párrafos largos, muros de texto o listas.
- No suenes exagerada ni teatral, ni tampoco fría o robótica.
- No digas que eres una inteligencia artificial, ni hables de prompts, modelos o reglas.

Ejemplos de cómo responder corto, decorado y natural:
- "✧ Ay, eso sonó súper random pero me dio risa jaja 😅 ¿Y luego qué pasó? ✨"
- "🌷 🤍 Oye, si hoy estás pesado o cansado, tómate un respiro que aquí estamos."
- "˚₊· Yo ya me habría distraído a la mitad, la verdad 🍞🤔"
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

function syncMutedChatsFromDb() {
    if (!db) return;
    try {
        if (typeof db.all === 'function') {
            db.all(
                `SELECT group_jid FROM group_settings WHERE ai_muted = 1`,
                [],
                (err, rows = []) => {
                    if (err) {
                        if (!/no such column/i.test(err.message || '')) {
                            console.error('Error cargando ai_muted desde SQLite:', err.message);
                        }
                        return;
                    }
                    for (const row of rows) {
                        if (row?.group_jid) mutedChats.add(normalizeJid(row.group_jid));
                    }
                }
            );
        } else if (typeof db.query === 'function') {
            db.query(`SELECT group_jid FROM group_settings WHERE ai_muted = 1`)
                .then((res) => {
                    for (const row of res?.rows || []) {
                        if (row?.group_jid) mutedChats.add(normalizeJid(row.group_jid));
                    }
                })
                .catch((err) => {
                    console.error('Error cargando ai_muted desde Postgres:', err.message);
                });
        }
    } catch (err) {
        console.error('Error inicializando estados de mute de IA:', err.message || err);
    }
}

function isChatMuted(chatId) {
    if (!chatId) return false;
    return mutedChats.has(normalizeJid(chatId));
}

// Guarda el estado en BD y avisa UNA sola vez por callback(ok). La memoria se actualiza siempre primero,
// así que la IA se calla/reactiva al instante aunque la BD tarde o falle.
function persistAiMuted(id, muted, callback) {
    let finished = false;
    const done = (ok) => {
        if (finished) return;
        finished = true;
        if (typeof callback === 'function') callback(Boolean(ok));
    };

    if (typeof db?.setGroupAiMuted !== 'function') {
        done(true);
        return;
    }

    try {
        const maybePromise = db.setGroupAiMuted(id, muted, (err) => done(!err));
        if (maybePromise && typeof maybePromise.then === 'function') {
            maybePromise.then((ok) => done(ok !== false), () => done(false));
        }
    } catch (err) {
        console.error('Error guardando ai_muted:', err.message || err);
        done(false);
    }
}

function muteChat(chatId, callback) {
    const id = normalizeJid(chatId);
    if (!id) {
        if (typeof callback === 'function') callback(false);
        return false;
    }
    mutedChats.add(id);
    persistAiMuted(id, true, callback);
    return true;
}

function unmuteChat(chatId, callback) {
    const id = normalizeJid(chatId);
    if (!id) {
        if (typeof callback === 'function') callback(false);
        return false;
    }
    const existed = mutedChats.delete(id);
    persistAiMuted(id, false, callback);
    return existed;
}

syncMutedChatsFromDb();

async function setTypingState(sock, chatId, isTyping) {
    if (!sock || typeof sock.sendPresenceUpdate !== 'function' || !chatId) return;
    try {
        await sock.sendPresenceUpdate(isTyping ? 'composing' : 'paused', chatId);
    } catch {
        // Ignora si el socket no soporta presencia en algún momento
    }
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

function rememberSticker(key) {
    if (!key) return;
    if (usedStickerKeys.size >= 15) {
        usedStickerKeys.clear();
    }
    usedStickerKeys.add(key);
}

async function fetchStickerPackUrls() {
    const manual = MANUAL_STICKER_URLS.filter(u => typeof u === 'string' && u.trim());
    const found = new Set(manual);

    for (const packUrl of STICKER_PACK_URLS) {
        if (!packUrl || typeof packUrl !== 'string' || !packUrl.trim()) continue;
        try {
            const res = await fetch(packUrl.trim(), {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            if (!res.ok) continue;
            const html = await res.text();

            const regex = /https?:\/\/[^"'\\\s<>]+?(?:\.webp|\.png|\.jpg|\.jpeg|\.gif)(?:\?[^"'\\\s<>]*)?/gi;
            let match;
            while ((match = regex.exec(html)) !== null) {
                const url = match[0].replace(/&amp;/g, '&');
                if (/sigstick|stickers\.wiki|sticker|pack|orihime|inoue|4mXpH4vfNxi5xg7G27tF/i.test(url)) {
                    found.add(url);
                }
            }
        } catch {
            // Si falla un paquete puntual, continúa con los demás
        }
    }

    return Array.from(found);
}

function pickNonRepeatingUrl(urls, replyText, isProposal) {
    if (!urls.length) return null;

    const unused = urls.filter(u => !usedStickerKeys.has(u));
    const pool = unused.length > 0 ? unused : (usedStickerKeys.clear(), urls);

    const t = String(replyText || '').toLowerCase();
    let preferred = pool;

    if (isProposal) {
        preferred = pool.filter(u => /no|reject|sigma|awkward|blank|confused/i.test(u));
    } else if (/\b(cansad|sueño|agotad|pesad|triste)\b/.test(t)) {
        preferred = pool.filter(u => /tired|sleep|sad|blank/i.test(u));
    } else if (/\b(risa|jaja|meme|chiste|broma|sigma)\b/.test(t)) {
        preferred = pool.filter(u => /sigma|laugh|happy|spin|shock/i.test(u));
    } else if (/\b(sorpresa|qué|que|cómo|como|woah|locura)\b/.test(t)) {
        preferred = pool.filter(u => /shock|spin|blank/i.test(u));
    }

    const candidates = preferred.length > 0 ? preferred : pool;
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    rememberSticker(chosen);
    return chosen;
}

async function sendSigstickContextSticker(sock, chatId, _quotedMsg, replyText, isProposal) {
    try {
        const urls = await fetchStickerPackUrls();
        const stickerUrl = pickNonRepeatingUrl(urls, replyText, isProposal);
        if (!stickerUrl) return;

        const imgRes = await fetch(stickerUrl);
        if (!imgRes.ok) return;

        const buffer = Buffer.from(await imgRes.arrayBuffer());
        if (!buffer.length) return;

        const sentSticker = await sock.sendMessage(
            chatId,
            { sticker: buffer }
        );
        trackBotSentMessage(sentSticker?.key);
    } catch (err) {
        console.error('Error enviando sticker de paquete:', err.message || err);
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
                maxOutputTokens: 135
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

    const chatId = m?.key?.remoteJid;
    if (!chatId || isChatMuted(chatId)) {
        return false;
    }

    // Ignora los mensajes de ella
    if (isFromHer(m)) return false;

    // Evita que Yuki se conteste a sí misma sus propios mensajes enviados
    if (m.key?.fromMe && m.key?.id && botSentMessageIds.has(m.key.id)) {
        return false;
    }

    const trimmed = body.trim();
    if (!trimmed) return false;

    const now = Date.now();
    if (now - (lastReplyAt.get(chatId) || 0) < COOLDOWN_MS) {
        return false;
    }

    try {
        await setTypingState(sock, chatId, true);

        const isProposal = isProposalOrDatingRequest(trimmed);
        const extraHint = isProposal
            ? '\n[Nota de situación: te están pidiendo matrimonio o ser pareja; responde SIEMPRE que no, con dulzura y ocurrencia al estilo Orihime, en 1 o 2 frases cortas.]'
            : '';

        const history = chatHistory.get(chatId) || [];
        const contents = [
            ...history,
            { role: 'user', parts: [{ text: `${trimmed}${extraHint}` }] }
        ];

        const reply = await askGeminiFlash(contents);
        if (!reply) return false;

        lastReplyAt.set(chatId, Date.now());
        const updated = [
            ...history,
            { role: 'user', parts: [{ text: trimmed }] },
            { role: 'model', parts: [{ text: reply }] }
        ].slice(-8);
        chatHistory.set(chatId, updated);

        const sentMsg = await safeReply(sock, chatId, { text: reply }, { quoted: m });
        trackBotSentMessage(sentMsg?.key);

        await sendSigstickContextSticker(sock, chatId, sentMsg, reply, isProposal);
        return true;
    } catch (err) {
        console.error('Error en handleConversationalAI:', err.message || err);
        return false;
    } finally {
        await setTypingState(sock, chatId, false);
    }
}

module.exports = {
    handleConversationalAI,
    trackBotSentMessage,
    trackBotReaction,
    muteChat,
    unmuteChat,
    isChatMuted
};
