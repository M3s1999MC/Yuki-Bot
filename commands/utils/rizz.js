const { askAI } = require('../../utils/aiClient');

module.exports = {
    name: 'rizz',
    aliases: ['comorespondo', 'respuesta', 'sugerencia'],
    category: 'utilidades',
    description: 'Propone tres respuestas según el texto y el tono indicado.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedText = quoted?.conversation ||
            quoted?.extendedTextMessage?.text ||
            quoted?.imageMessage?.caption ||
            quoted?.videoMessage?.caption || '';
        const tone = args[0]?.toLowerCase();
        const hasTone = ['coqueto', 'gracioso', 'directo', 'tierno'].includes(tone);
        const toneLabel = hasTone ? tone : 'natural';
        const input = args.slice(hasTone ? 1 : 0).join(' ').trim() || quotedText.trim();
        if (!input) {
            return sock.sendMessage(jid, { text: '「✿」 Escribe un texto o responde al mensaje al que quieres contestar.' }, { quoted: m });
        }
        const subject = input.replace(/\s+/g, ' ').slice(0, 100);
        const suggestions = toneLabel === 'gracioso'
            ? [`"Necesito contexto, ¿esto viene con tutorial?"`, `"Me hiciste reír, ahora te toca explicar esa parte: ${subject}"`, `"Mi respuesta profesional es: cuéntame más 😄"`]
            : toneLabel === 'directo'
                ? [`"Me interesa lo que dices de ${subject}; ¿me cuentas más?"`, `"Me gusta hablar contigo. ¿Seguimos esta conversación?"`, `"Voy al grano: ¿te gustaría que nos conociéramos mejor?"`]
                : toneLabel === 'tierno'
                    ? [`"Qué lindo que me cuentes eso de ${subject} 🌸"`, `"Me encanta conocer esos detalles de ti."`, `"Eso me sacó una sonrisa; cuéntame un poquito más 💗"`]
                    : [`"Ahora me dio curiosidad lo de ${subject} 👀"`, `"No esperaba esa respuesta, cuéntame más."`, `"Me gusta cómo piensas; ¿qué más debería saber de ti?"`];
        let responseLines = suggestions;
        if (process.env.AI_API_URL && process.env.AI_API_KEY) {
            try {
                const generated = await askAI(`Propón exactamente tres respuestas breves, una por línea, en tono ${toneLabel}, para este mensaje: ${input}`, {
                    system: 'Eres un asistente de conversación respetuoso. No incluyas contenido sexual ni manipulador.'
                });
                responseLines = generated.split(/\r?\n/).map(line => line.replace(/^\s*(?:\d+[.)-]|[-•])\s*/, '').trim()).filter(Boolean).slice(0, 3);
                if (!responseLines.length) responseLines = suggestions;
            } catch (err) {
                console.error('Rizz IA no disponible; uso respuestas locales:', err.message);
            }
        }
        const text = `「✿」 Tres respuestas en tono *${toneLabel}* 💬\n\n${responseLines.map((line, i) => `${i + 1}. ${line}`).join('\n\n')}\n\n_Usa !guardar <frase> para guardar una._`;
        await sock.sendMessage(jid, { text }, { quoted: m });
    }
};
