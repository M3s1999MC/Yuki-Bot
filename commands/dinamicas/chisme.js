const { trackBotSentMessage } = require('../../handlers/aiChat');

const PREDICTIONS = [
    'Veo que hoy alguien va a decir "ya me voy a dormir" y aparecerá dos horas después.',
    'La bola dice que se viene un giro inesperado en el grupo antes de que acabe el día.',
    'Tiempos de paz... aunque por si acaso ten a la mano un buen sticker listo.',
    'Hoy hay altas probabilidades de que un plan de cinco minutos se convierta en charla eterna.'
];

function hashText(input) {
    let h = 0;
    for (let i = 0; i < input.length; i++) {
        h = (h * 31 + input.charCodeAt(i)) >>> 0;
    }
    return h;
}

module.exports = {
    name: 'chisme',
    aliases: ['boladecristal'],
    category: 'dinamicas',
    description: 'Lanza una predicción chistosa sobre lo que pasará en el chat.',

    async execute(sock, m, args = []) {
        const jid = m?.key?.remoteJid;
        if (!jid) return;

        try {
            if (typeof sock.sendPresenceUpdate === 'function') {
                await sock.sendPresenceUpdate('composing', jid).catch(() => {});
            }

            const topic = Array.isArray(args) && args.length ? args.join(' ').trim() : 'el grupo hoy';
            const idx = hashText(`${jid}:${topic}:${new Date().toDateString()}`) % PREDICTIONS.length;
            const prediction = PREDICTIONS[idx];

            const reply = [
                `🔮 *Bola de Orihime*`,
                `• *Tema:* ${topic}`,
                ``,
                `${prediction}`
            ].join('\n');

            const sent = await sock.sendMessage(jid, { text: reply }, { quoted: m });
            trackBotSentMessage?.(sent?.key);
        } catch (err) {
            console.error('[chisme] Error en predicción:', err.message || err);
            const errMsg = await sock.sendMessage(
                jid,
                { text: '😅 La bolita se puso borrosa por el vapor del pan... ¿intentamos luego? 🍞' },
                { quoted: m }
            );
            trackBotSentMessage?.(errMsg?.key);
        } finally {
            if (typeof sock.sendPresenceUpdate === 'function') {
                await sock.sendPresenceUpdate('paused', jid).catch(() => {});
            }
        }
    }
};
