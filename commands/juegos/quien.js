const { trackBotSentMessage } = require('../../handlers/aiChat');

const activePolls = new Map();

function parseDurationMs(args) {
    if (!Array.isArray(args) || !args.length) return { durationMs: 45000, restArgs: [] };
    const first = String(args[0]).toLowerCase().trim();
    const matchSec = first.match(/^(\d{1,3})s$/);
    const matchMin = first.match(/^(\d{1,2})m$/);

    if (matchSec) {
        const secs = Math.min(Math.max(parseInt(matchSec[1], 10), 10), 180);
        return { durationMs: secs * 1000, restArgs: args.slice(1) };
    }
    if (matchMin) {
        const mins = Math.min(Math.max(parseInt(matchMin[1], 10), 1), 3);
        return { durationMs: mins * 60 * 1000, restArgs: args.slice(1) };
    }
    return { durationMs: 45000, restArgs: args };
}

function extractTextFromMsg(msg) {
    return (
        msg?.message?.conversation ||
        msg?.message?.extendedTextMessage?.text ||
        ''
    ).trim();
}

function registerPollVoter(jid, senderJid, optionIndex) {
    const poll = activePolls.get(jid);
    if (!poll) return false;
    if (optionIndex < 0 || optionIndex >= poll.options.length) return false;
    poll.votes.set(senderJid, optionIndex);
    return true;
}

module.exports = {
    name: 'quien',
    aliases: ['voto'],
    category: 'juegos',
    description: 'Lanza una votación rápida de etiqueta o pregunta en el grupo.',
    registerPollVoter,

    async execute(sock, m, args = []) {
        const jid = m?.key?.remoteJid;
        if (!jid) return;

        try {
            if (typeof sock.sendPresenceUpdate === 'function') {
                await sock.sendPresenceUpdate('composing', jid).catch(() => {});
            }

            if (activePolls.has(jid)) {
                const busyMsg = await sock.sendMessage(
                    jid,
                    { text: '⏳ Ya hay una votación activa en este grupito. ¡Espera a que cierre! 🌸' },
                    { quoted: m }
                );
                trackBotSentMessage?.(busyMsg?.key);
                return;
            }

            const { durationMs, restArgs } = parseDurationMs(args);
            const rawInput = restArgs.join(' ').trim();

            if (!rawInput) {
                const helpMsg = await sock.sendMessage(
                    jid,
                    {
                        text: [
                            '🗳️ *Uso de !quien*',
                            '• *!quien <pregunta> | op1, op2, op3*',
                            '• *!quien 30s <pregunta> | @alguien1, @alguien2*',
                            'Responde *1*, *2*, *3*... mientras dure la votación.'
                        ].join('\n')
                    },
                    { quoted: m }
                );
                trackBotSentMessage?.(helpMsg?.key);
                return;
            }

            const [questionPart, optionsPart] = rawInput.split('|').map((s) => s.trim());
            const question = questionPart || '¿Quién gana esta ronda?';
            const options = optionsPart
                ? optionsPart.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 6)
                : ['Opción A', 'Opción B', 'Opción C'];

            const mentioned = m?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            const pollState = {
                question,
                options,
                votes: new Map(),
                closed: false
            };
            activePolls.set(jid, pollState);

            const secLabel = Math.round(durationMs / 1000);
            const optionLines = options.map((opt, idx) => `${idx + 1}. ${opt}`).join('\n');

            const openMsg = await sock.sendMessage(
                jid,
                {
                    text: [
                        `🗳️ *Votación relámpago* (${secLabel}s)`,
                        `❓ *${question}*`,
                        ``,
                        optionLines,
                        ``,
                        `_Responde con el número (1-${options.length}) para votar._`
                    ].join('\n'),
                    mentions: mentioned
                },
                { quoted: m }
            );
            trackBotSentMessage?.(openMsg?.key);

            const onUpsert = (upsert) => {
                if (pollState.closed) return;
                const list = upsert?.messages || [];
                for (const incoming of list) {
                    if (incoming?.key?.remoteJid !== jid || incoming?.key?.fromMe) continue;
                    const txt = extractTextFromMsg(incoming);
                    const num = parseInt(txt, 10);
                    if (!Number.isNaN(num) && String(num) === txt) {
                        const voter = incoming.key.participant || incoming.key.remoteJid;
                        registerPollVoter(jid, voter, num - 1);
                    }
                }
            };

            sock.ev?.on?.('messages.upsert', onUpsert);

            setTimeout(async () => {
                pollState.closed = true;
                sock.ev?.off?.('messages.upsert', onUpsert);
                activePolls.delete(jid);

                const tally = new Array(options.length).fill(0);
                for (const optIdx of pollState.votes.values()) {
                    tally[optIdx] += 1;
                }

                const totalVotes = pollState.votes.size;
                const resultsLines = options
                    .map((opt, idx) => `• *${opt}:* ${tally[idx]} ${tally[idx] === 1 ? 'voto' : 'votos'}`)
                    .join('\n');

                const closeMsg = await sock.sendMessage(
                    jid,
                    {
                        text: [
                            `🏁 *Resultados de la votación*`,
                            `❓ *${question}*`,
                            ``,
                            resultsLines,
                            ``,
                            `📊 *Total de votantes:* ${totalVotes}`
                        ].join('\n')
                    },
                    { quoted: openMsg }
                );
                trackBotSentMessage?.(closeMsg?.key);
            }, durationMs);
        } catch (err) {
            activePolls.delete(jid);
            console.error('[quien] Error en votación:', err.message || err);
            const errMsg = await sock.sendMessage(
                jid,
                { text: '😅 Se me enredó la urna de votación... ¿lo probamos de nuevo? 🍡' },
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
