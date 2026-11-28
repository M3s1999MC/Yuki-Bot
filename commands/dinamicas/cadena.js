const { trackBotSentMessage } = require('../../handlers/aiChat');

const activeChains = new Map();

function normalizeWord(input = '') {
    return input
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z]/g, '')
        .trim();
}

function extractText(msg) {
    return (
        msg?.message?.conversation ||
        msg?.message?.extendedTextMessage?.text ||
        ''
    ).trim();
}

module.exports = {
    name: 'cadena',
    aliases: ['cadenapalabras'],
    category: 'dinamicas',
    description: 'Inicia una cadena de palabras en el grupo (cada palabra empieza con la última letra de la anterior).',

    async execute(sock, m, args = []) {
        const jid = m?.key?.remoteJid;
        if (!jid) return;

        try {
            if (typeof sock.sendPresenceUpdate === 'function') {
                await sock.sendPresenceUpdate('composing', jid).catch(() => {});
            }

            if (activeChains.has(jid)) {
                const busy = await sock.sendMessage(
                    jid,
                    { text: '🔗 ¡Ya hay una cadena activa en este grupo! Sigan jugando esa ronda primero, ¿sí? 🌸' },
                    { quoted: m }
                );
                trackBotSentMessage?.(busy?.key);
                return;
            }

            const starterRaw = (Array.isArray(args) && args[0]) ? args[0] : 'pan';
            const firstWord = normalizeWord(starterRaw) || 'pan';
            const requiredChar = firstWord[firstWord.length - 1];

            const state = {
                active: true,
                used: new Set([firstWord]),
                lastWord: firstWord,
                requiredChar,
                count: 1,
                timer: null,
                listener: null
            };
            activeChains.set(jid, state);

            const startMsg = await sock.sendMessage(
                jid,
                {
                    text: [
                        `🔗 *Cadena de palabras* (45s)`,
                        `• *Palabra inicial:* *${firstWord}*`,
                        `• *Letra que toca:* *${requiredChar.toUpperCase()}*`,
                        ``,
                        `_Escriban una sola palabra que empiece con *${requiredChar.toUpperCase()}* y no se haya usado._`
                    ].join('\n')
                },
                { quoted: m }
            );
            trackBotSentMessage?.(startMsg?.key);

            const cleanup = () => {
                state.active = false;
                if (state.timer) clearTimeout(state.timer);
                if (state.listener) sock.ev?.off?.('messages.upsert', state.listener);
                activeChains.delete(jid);
            };

            const onUpsert = async (upsert) => {
                if (!state.active) return;
                const messages = upsert?.messages || [];

                for (const incoming of messages) {
                    if (incoming?.key?.remoteJid !== jid || incoming?.key?.fromMe) continue;
                    const rawText = extractText(incoming).trim();
                    if (!rawText || rawText.includes(' ') || rawText.startsWith('!')) continue;

                    const word = normalizeWord(rawText);
                    if (word.length < 2) continue;

                    if (!word.startsWith(state.requiredChar)) continue;
                    if (state.used.has(word)) {
                        const repMsg = await sock.sendMessage(
                            jid,
                            { text: `⚠️ *"${word}"* ya se dijo en esta cadena. ¡Busquen otra con *${state.requiredChar.toUpperCase()}*!` },
                            { quoted: incoming }
                        );
                        trackBotSentMessage?.(repMsg?.key);
                        continue;
                    }

                    state.used.add(word);
                    state.lastWord = word;
                    state.requiredChar = word[word.length - 1];
                    state.count += 1;

                    const stepMsg = await sock.sendMessage(
                        jid,
                        { text: `✅ *${word}* (#${state.count}) → Ahora toca con *${state.requiredChar.toUpperCase()}*` },
                        { quoted: incoming }
                    );
                    trackBotSentMessage?.(stepMsg?.key);
                }
            };

            state.listener = onUpsert;
            sock.ev?.on?.('messages.upsert', onUpsert);

            state.timer = setTimeout(async () => {
                if (!state.active) return;
                const total = state.count;
                const last = state.lastWord;
                cleanup();

                const endMsg = await sock.sendMessage(
                    jid,
                    {
                        text: [
                            `🏁 *Fin de la cadena de palabras*`,
                            `• *Palabras encadenadas:* ${total}`,
                            `• *Última palabra:* *${last}*`,
                            `¡Buen trabajo, equipo! 🍞✨`
                        ].join('\n')
                    },
                    { quoted: startMsg }
                );
                trackBotSentMessage?.(endMsg?.key);
            }, 45000);
        } catch (err) {
            const existing = activeChains.get(jid);
            if (existing?.timer) clearTimeout(existing.timer);
            if (existing?.listener) sock.ev?.off?.('messages.upsert', existing.listener);
            activeChains.delete(jid);

            console.error('[cadena] Error en cadena de palabras:', err.message || err);
            const errMsg = await sock.sendMessage(
                jid,
                { text: '😅 Se me rompió la cadenita... ¿empezamos otra? 🌸' },
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
