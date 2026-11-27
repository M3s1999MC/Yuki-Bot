const { trackBotSentMessage } = require('../../handlers/aiChat');

const VERDICTS = [
    {
        tag: 'HUMO PURO',
        emoji: '💨🚩',
        line: 'Suena a cuento inventado a las tres de la mañana con un sándwich a medias.'
    },
    {
        tag: 'MEDIO VERDAD, MEDIO CHISME',
        emoji: '🧁👀',
        line: 'Tiene un pedacito de realidad, pero le echaron demasiada salsa encima.'
    },
    {
        tag: 'EXAGERACIÓN ÉPICA',
        emoji: '🎭✨',
        line: 'Pasó algo parecido, pero aquí lo inflaron como globo de feria.'
    },
    {
        tag: 'SOSPECHOSAMENTE PROBABLE',
        emoji: '🍵🤔',
        line: 'No tengo pruebas de oro, pero tampoco me sorprendería nada si es cierto.'
    },
    {
        tag: 'CONFIRMADO POR ORIHIME',
        emoji: '🌸✅',
        line: 'Hoy el universo decidió darle la razón a esa frase... ¡qué locura!'
    }
];

function getQuotedText(m) {
    const quoted = m?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) return '';
    return (
        quoted.conversation ||
        quoted.extendedTextMessage?.text ||
        quoted.imageMessage?.caption ||
        quoted.videoMessage?.caption ||
        ''
    ).trim();
}

function pickVerdict(claim) {
    let hash = 0;
    for (let i = 0; i < claim.length; i++) {
        hash = (hash * 31 + claim.charCodeAt(i)) >>> 0;
    }
    return VERDICTS[hash % VERDICTS.length];
}

module.exports = {
    name: 'desmentir',
    aliases: ['chequeo'],
    category: 'dinamicas',
    description: 'Evalúa con chispa una afirmación o chisme del chat.',

    async execute(sock, m, args = []) {
        const jid = m?.key?.remoteJid;
        if (!jid) return;

        try {
            if (typeof sock.sendPresenceUpdate === 'function') {
                await sock.sendPresenceUpdate('composing', jid).catch(() => {});
            }

            const argText = Array.isArray(args) ? args.join(' ').trim() : '';
            const claim = argText || getQuotedText(m);

            if (!claim) {
                const msg = await sock.sendMessage(
                    jid,
                    { text: '🔍 Dime qué quieres que revise con *!desmentir <frase>* o responde a un mensaje, ¿vale? 🌸' },
                    { quoted: m }
                );
                trackBotSentMessage?.(msg?.key);
                return;
            }

            const verdict = pickVerdict(claim);
            const reply = [
                `🍡 *Chequeo de Orihime* ${verdict.emoji}`,
                `• *Afirmación:* "${claim}"`,
                `• *Veredicto:* *${verdict.tag}*`,
                ``,
                `${verdict.line}`
            ].join('\n');

            const sent = await sock.sendMessage(jid, { text: reply }, { quoted: m });
            trackBotSentMessage?.(sent?.key);
        } catch (err) {
            console.error('[desmentir] Error al evaluar afirmación:', err.message || err);
            const errMsg = await sock.sendMessage(
                jid,
                { text: '😅 Me mareé revisando tanto chisme... ¿me repites la frase? 🍞' },
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
