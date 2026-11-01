const { askAI } = require('../../utils/aiClient');

module.exports = {
    name: 'chatgpt',
    aliases: ['ia'],
    category: 'utility',
    description: 'Realiza peticiones a ChatGPT o la IA de respaldo.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const query = args.join(' ');

        if (!query) {
            return await sock.sendMessage(jid, { text: '⚠️ Por favor escribe una pregunta o texto para la IA.\n\n*Ejemplo:* `!ia ¿Qué es Godot Engine?`' }, { quoted: m });
        }

        await sock.sendMessage(jid, { text: '🤖 Procesando respuesta...' }, { quoted: m });
        try {
            const answer = await askAI(query, { system: 'Eres Yuki, una asistente útil. Responde en español y no inventes fuentes.' });
            await sock.sendMessage(jid, { text: `🤖 *Yuki AI*\n\n${answer.slice(0, 8000)}` }, { quoted: m });
        } catch (err) {
            console.error('Error en !chatgpt:', err.message);
            await sock.sendMessage(jid, {
                text: '❌ No pude conectar con la IA. Configura AI_API_URL y AI_API_KEY para un endpoint compatible con OpenAI, o revisa el servicio de respaldo.'
            }, { quoted: m });
        }
    }
};