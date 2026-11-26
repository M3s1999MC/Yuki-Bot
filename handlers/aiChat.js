import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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

export async function handleConversationalAI(sock, m, bodyText) {
  if (!bodyText || m.key.fromMe) return false;
  if (!process.env.GEMINI_API_KEY) return false;

  const chatId = m.key.remoteJid;
  const now = Date.now();
  const prevTime = lastReplyAt.get(chatId) || 0;
  if (now - prevTime < COOLDOWN_MS) return false;

  try {
    const history = chatHistory.get(chatId) || [];
    const contents = [
      ...history,
      { role: 'user', parts: [{ text: bodyText }] }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction: YUKI_ORIHIME_PERSONA
      }
    });

    const reply = response.text?.trim();
    if (!reply) return false;

    lastReplyAt.set(chatId, now);
    const updated = [
      ...history,
      { role: 'user', parts: [{ text: bodyText }] },
      { role: 'model', parts: [{ text: reply }] }
    ].slice(-8);
    chatHistory.set(chatId, updated);

    await sock.sendMessage(chatId, { text: reply }, { quoted: m });
    return true;
  } catch (err) {
    console.error('Error en aiChat:', err);
    return false;
  }
}
