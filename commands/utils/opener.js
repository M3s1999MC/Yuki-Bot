const { askAI } = require('../../utils/aiClient');

module.exports = {
    name: 'opener',
    aliases: ['abridor', 'apertura'],
    category: 'utilidades',
    description: 'Genera tres mensajes de apertura basados en una bio o descripción.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const context = m.message?.extendedTextMessage?.contextInfo;
        const quoted = context?.quotedMessage;
        const bio = args.join(' ').trim() ||
            quoted?.conversation ||
            quoted?.extendedTextMessage?.text ||
            quoted?.imageMessage?.caption ||
            'un perfil interesante';
        const detail = bio.replace(/\s+/g, ' ').slice(0, 90);
        let options = [
            `Vi que mencionas _${detail}_ y me dio curiosidad: ¿qué es lo que más disfrutas de eso?`,
            `Pregunta importante sobre _${detail}_: ¿cómo empezó esa afición? 🌸`,
            `Tu perfil me dejó con una duda: ¿qué historia hay detrás de _${detail}_?`
        ];
        if (process.env.AI_API_URL && process.env.AI_API_KEY) {
            try {
                const generated = await askAI(`Escribe tres mensajes respetuosos para iniciar conversación basados en esta bio: ${bio}`, {
                    system: 'Eres un asistente de conversación respetuoso. Devuelve tres opciones breves en líneas separadas, sin presión ni contenido sexual.'
                });
                const parsed = generated.split(/\r?\n/).map(line => line.replace(/^\s*(?:\d+[.)-]|[-•])\s*/, '').trim()).filter(Boolean).slice(0, 3);
                if (parsed.length) options = parsed;
            } catch (err) {
                console.error('Opener IA no disponible; uso respuestas locales:', err.message);
            }
        }
        await sock.sendMessage(jid, {
            text: `「✿」 Tres ideas para iniciar conversación ✨\n\n${options.map((option, i) => `${i + 1}. ${option}`).join('\n\n')}`
        }, { quoted: m });
    }
};
