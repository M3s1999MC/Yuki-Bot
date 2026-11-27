const { trackBotSentMessage } = require('../../handlers/aiChat');

let getGroupBuffer = null;
try {
    const aiChat = require('../../handlers/aiChat');
    if (typeof aiChat.getRecentMessages === 'function') {
        getGroupBuffer = aiChat.getRecentMessages;
    } else if (typeof aiChat.getGroupBuffer === 'function') {
        getGroupBuffer = aiChat.getGroupBuffer;
    }
} catch {}

function collectRecentTexts(m, jid) {
    const texts = [];

    const quotedText =
        m?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation ||
        m?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text;
    if (quotedText && typeof quotedText === 'string') {
        texts.push(quotedText.trim());
    }

    if (typeof getGroupBuffer === 'function') {
        try {
            const raw = getGroupBuffer(jid, 25);
            if (Array.isArray(raw)) {
                for (const item of raw) {
                    if (typeof item === 'string' && item.trim()) {
                        texts.push(item.trim());
                    } else if (item && typeof item.text === 'string' && item.text.trim()) {
                        texts.push(item.text.trim());
                    }
                }
            }
        } catch {}
    }

    return texts.slice(-25);
}

function detectMood(samples) {
    const joined = samples.join(' ').toLowerCase();
    const hour = new Date().getHours();

    if (!joined.trim()) {
        if (hour >= 0 && hour < 6) {
            return {
                label: 'Madrugada fantasma',
                emoji: '🌙🕯️',
                note: 'Está bien silencioso por aquí... ¿alguien sigue despierto o ya todos se durmieron con un pan en la mano?'
            };
        }
        return {
            label: 'Calma chicha',
            emoji: '🍡☁️',
            note: 'El chat está tranquilito ahora mismo, como esperando que alguien suelte el primer chisme o meme del día.'
        };
    }

    const laughCount = (joined.match(/jaja|jeje|xd|lmao|😂|🤣|💀/g) || []).length;
    const chaosCount = (joined.match(/loco|grito|ayuda|fuego|caos|borra|funar|qué pasó|que paso|🔥|🚨|⚠️/g) || []).length;
    const sadCount = (joined.match(/triste|bajón|bajon|llorar|mal|cansad|sueño|sueno|😭|💔|😔/g) || []).length;

    if (chaosCount >= 3) {
        return {
            label: 'Caos sabroso',
            emoji: '⚡🍞',
            note: '¡Uy, se prendió esto! Hay puro movimiento y enredos por todos lados, pero me gusta cuando el grupo tiene vida.'
        };
    }

    if (laughCount >= 4) {
        return {
            label: 'Risa y descontrol',
            emoji: '✨😄',
            note: 'Andan de buen humor y soltando carcajadas en el chat. ¡Así da gusto pasar por aquí!'
        };
    }

    if (sadCount >= 2) {
        return {
            label: 'Modo bajón / sueñito',
            emoji: '🌧️🧸',
            note: 'Siento el ambiente un poquito pesado o con cansancio... si quieren, les convido un tecito virtual y un abrazo.'
        };
    }

    if (hour >= 0 && hour < 6) {
        return {
            label: 'Trasnochadores',
            emoji: '🌌🍵',
            note: '¡Ya es re tarde/temprano! Están activos a horas raras, cuídense los ojitos que mañana pesa.'
        };
    }

    return {
        label: 'Charla casual',
        emoji: '🌸💬',
        note: 'El grupo está en una vibra relajada y conversadora, ideal para tirar una buena pregunta o un chiste.'
    };
}

module.exports = {
    name: 'moodgrupo',
    aliases: ['ambiente', 'termometro'],
    category: 'dinamicas',
    description: 'Detecta el ambiente o mood reciente del grupo.',

    async execute(sock, m, args = []) {
        const jid = m?.key?.remoteJid;
        if (!jid) return;

        try {
            if (typeof sock.sendPresenceUpdate === 'function') {
                await sock.sendPresenceUpdate('composing', jid).catch(() => {});
            }

            const manualText = Array.isArray(args) && args.length ? args.join(' ').trim() : '';
            const samples = manualText ? [manualText] : collectRecentTexts(m, jid);
            const mood = detectMood(samples);

            const reply = [
                `🌸 *Termómetro del grupo* ${mood.emoji}`,
                `• *Ambiente:* ${mood.label}`,
                `• *Muestras leídas:* ${samples.length}`,
                ``,
                `${mood.note}`
            ].join('\n');

            const sent = await sock.sendMessage(jid, { text: reply }, { quoted: m });
            trackBotSentMessage?.(sent?.key);
        } catch (err) {
            console.error('[moodgrupo] Error al analizar ambiente:', err.message || err);
            const errMsg = await sock.sendMessage(
                jid,
                { text: '😅 Ay, se me nubló tantito el termómetro del grupo... ¿intentamos de nuevo en un ratito? 🍞' },
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
