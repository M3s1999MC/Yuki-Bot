const { muteChat, unmuteChat, isChatMuted, trackBotSentMessage } = require('../handlers/aiChat');

const UNMUTE_WORDS = new Set([
    'on',
    'hablar',
    'yukihablar',
    'hablaryuki',
    'desmutear',
    'unmute',
    'unmuteai',
    'activar',
    'encender'
]);

const MUTE_WORDS = new Set([
    'off',
    'callar',
    'yukicallar',
    'callaryuki',
    'silenciar',
    'silenciayuki',
    'mutear',
    'mute',
    'muteai',
    'apagar'
]);

function resolveAction(m, args = [], context = {}) {
    const firstArg = String(args?.[0] || '').trim().toLowerCase();
    if (UNMUTE_WORDS.has(firstArg)) return 'unmute';
    if (MUTE_WORDS.has(firstArg)) return 'mute';

    const invokedCmd = String(context.command || context.cmd || '').trim().toLowerCase();
    if (UNMUTE_WORDS.has(invokedCmd)) return 'unmute';
    if (MUTE_WORDS.has(invokedCmd)) return 'mute';

    const rawText = String(
        context.body ||
        m?.message?.conversation ||
        m?.message?.extendedTextMessage?.text ||
        ''
    )
        .trim()
        .toLowerCase();

    const match = rawText.match(/^[!/.]?([a-z0-9_]+)/i);
    const token = (match?.[1] || '').toLowerCase();
    if (UNMUTE_WORDS.has(token)) return 'unmute';
    if (MUTE_WORDS.has(token)) return 'mute';

    return 'mute';
}

module.exports = {
    name: 'yukicallar',
    aliases: [
        'callaryuki',
        'silenciayuki',
        'muteai',
        'yukihablar',
        'hablaryuki',
        'desmutear',
        'unmuteai'
    ],
    category: 'ia',
    description: 'Calla o vuelve a hacer hablar solo a la IA de Yuki en este chat',

    async execute(sock, m, args = [], context = {}) {
        const chatId = m?.key?.remoteJid;
        if (!chatId) return false;

        const safeReply =
            typeof context.safeReply === 'function'
                ? context.safeReply
                : (s, jid, content, opts) => s.sendMessage(jid, content, opts);

        const action = resolveAction(m, args, context);

        if (action === 'unmute') {
            unmuteChat(chatId);
            const sentMsg = await safeReply(
                sock,
                chatId,
                { text: '✧ ¡Ya volví a charlar por aquí! ¿De qué estábamos hablando? ✨😄' },
                { quoted: m }
            );
            trackBotSentMessage?.(sentMsg?.key);
            return true;
        }

        muteChat(chatId);
        const sentMsg = await safeReply(
            sock,
            chatId,
            { text: '˚₊· Vale, me quedo calladita en la IA por aquí, pero sigo activa para comandos 🙈🍞' },
            { quoted: m }
        );
        trackBotSentMessage?.(sentMsg?.key);
        return true;
    },

    isChatMuted,
    muteChat,
    unmuteChat
};
