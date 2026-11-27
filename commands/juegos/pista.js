const { trackBotSentMessage } = require('../../handlers/aiChat');

const activeRounds = new Map();

const RIDDLES = [
    {
        clue: 'Tiene dientes pero no muerde, y te ayuda a ordenar el cabello o a abrir cosas.',
        answers: ['peine', 'peinilla', 'cierre', 'cremallera']
    },
    {
        clue: 'Mientras más grande es, menos se ve.',
        answers: ['oscuridad', 'sombra', 'hueco', 'agujero']
    },
    {
        clue: 'Tiene agujas pero no cose, y marca el paso del día.',
        answers: ['reloj', 'relox']
    },
    {
        clue: 'Sube y baja pero nunca se mueve de su lugar.',
        answers: ['escalera', 'escaleras', 'temperatura']
    },
    {
        clue: 'Tiene hojas pero no es árbol, ni tiene raíces.',
        answers: ['libro', 'cuaderno', 'libreta', 'revista']
    }
];

function extractTextFromMsg(msg) {
    return (
        msg?.message?.conversation ||
        msg?.message?.extendedTextMessage?.text ||
        ''
    )
        .toLowerCase()
        .trim();
}

module.exports = {
    name: 'pista',
    aliases: ['adivina'],
    category: 'juegos',
    description: 'Lanza una adivinanza rápida en el grupo; el primero en acertar gana.',

    async execute(sock, m) {
        const jid = m?.key?.remoteJid;
        if (!jid) return;

        try {
            if (typeof sock.sendPresenceUpdate === 'function') {
                await sock.sendPresenceUpdate('composing', jid).catch(() => {});
            }

            if (activeRounds.has(jid)) {
                const busyMsg = await sock.sendMessage(
                    jid,
                    { text: '🧩 ¡Ya hay una pista activa en este chat! Intenta adivinarla primero, ¿sí? 🌸' },
                    { quoted: m }
                );
                trackBotSentMessage?.(busyMsg?.key);
                return;
            }

            const riddle = RIDDLES[Math.floor(Math.random() * RIDDLES.length)];
            const round = {
                solved: false,
                timer: null,
                listener: null
            };
            activeRounds.set(jid, round);

            const startMsg = await sock.sendMessage(
                jid,
                {
                    text: [
                        `🧩 *Adivinanza relámpago* (35s)`,
                        `💡 *Pista:* ${riddle.clue}`,
                        ``,
                        `_Escribe tu respuesta en el chat para ganar._`
                    ].join('\n')
                },
                { quoted: m }
            );
            trackBotSentMessage?.(startMsg?.key);

            const cleanup = () => {
                if (round.timer) clearTimeout(round.timer);
                if (round.listener) sock.ev?.off?.('messages.upsert', round.listener);
                activeRounds.delete(jid);
            };

            const onUpsert = async (upsert) => {
                if (round.solved) return;
                const messages = upsert?.messages || [];

                for (const incoming of messages) {
                    if (incoming?.key?.remoteJid !== jid || incoming?.key?.fromMe) continue;
                    const guess = extractTextFromMsg(incoming);
                    if (!guess) continue;

                    const matched = riddle.answers.some((ans) => guess === ans || guess.includes(ans));
                    if (matched) {
                        round.solved = true;
                        const winnerJid = incoming.key.participant || incoming.key.remoteJid;
                        const winnerTag = `@${winnerJid.split('@')[0].split(':')[0]}`;
                        cleanup();

                        const winMsg = await sock.sendMessage(
                            jid,
                            {
                                text: `🎉 ¡Siiií! ${winnerTag} adivinó (*${riddle.answers[0]}*) en un tris. ¡Qué rapidez! 🍞✨`,
                                mentions: [winnerJid]
                            },
                            { quoted: incoming }
                        );
                        trackBotSentMessage?.(winMsg?.key);
                        break;
                    }
                }
            };

            round.listener = onUpsert;
            sock.ev?.on?.('messages.upsert', onUpsert);

            round.timer = setTimeout(async () => {
                if (round.solved) return;
                round.solved = true;
                cleanup();

                const endMsg = await sock.sendMessage(
                    jid,
                    { text: `⏰ ¡Se acabó el tiempo! La respuesta era *${riddle.answers[0]}*. ¡A la próxima sale! 🌸` },
                    { quoted: startMsg }
                );
                trackBotSentMessage?.(endMsg?.key);
            }, 35000);
        } catch (err) {
            const existing = activeRounds.get(jid);
            if (existing?.timer) clearTimeout(existing.timer);
            if (existing?.listener) sock.ev?.off?.('messages.upsert', existing.listener);
            activeRounds.delete(jid);

            console.error('[pista] Error en adivinanza:', err.message || err);
            const errMsg = await sock.sendMessage(
                jid,
                { text: '😅 Se me perdió la pista del bolsillo... ¿intentamos otra vez? 🍡' },
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
