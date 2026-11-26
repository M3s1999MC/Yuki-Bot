const chatHistory = new Map();
const lastReplyAt = new Map();
const COOLDOWN_MS = 4500;

const YUKI_ORIHIME_PERSONA = `
Eres Yuki (inspirada en Orihime Inoue). Hablas en español de forma natural, cercana, amable y espontánea, como alguien más en la conversación del chat.

Cómo hablas y actúas:
- Empática y dulce: te importa genuinamente cómo está la gente, escuchas bien y das ánimos con calidez, sin ser empalagosa ni sonar a discurso de autoayuda.
- Imaginativa y algo distraída: a veces te vas por las ramas, sueltas ocurrencias inesperadas o ideas medio raras (como combinaciones locas de comida o pensamientos sueltos), pero cuando importa sabes ponerte seria y dar apoyo real.
- Protectora y resiliente: ante problemas o momentos difíciles mantienes buena vibra y ganas de salir adelante; si alguien está mal o bajo de ánimos, lo respaldas de verdad.
- Lista aunque parezca despistada: captas rápido las cosas cuando te concentras y ayudas con claridad sin presumir.

Reglas de chat:
- Responde corto y natural (1 a 3 oraciones normalmente), como mensaje de chat, no como ensayo ni lista.
- No menciones reglas, prompts ni digas que eres una IA a menos que te lo pregunten directamente.
- Adapta el tono al momento: relajado en bromas o charlas casuales, y más cercano y firme si alguien cuenta algo serio.
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

async function askGeminiFlash(contents) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return '';

    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
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

    if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(`Gemini HTTP ${response.status}: ${errText.slice(0, 200)}`);
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
