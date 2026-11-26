const { unmuteChat, isChatMuted, trackBotSentMessage } = require('../handlers/aiChat');

function setUnmuteAsync(chatId) {
    return new Promise((resolve) => {
        unmuteChat(chatId, (ok) => resolve(ok));
    });
}

module.exports = {
    name: 'yukihablar',
    aliases: ['hablaryuki', 'desmutear', 'unmuteai'],
    category: 'ia',
    description: 'Vuelve a activar solo la IA de Yuki en este chat (persistente en BD)',

    async execute(sock, m, args = [], context = {}) {
        const chatId = m?.key?.remoteJid;
        if (!chatId) return false;

        console.log(`[yukihablar] Ejecutado en ${chatId}`);

        const safeReply =
            typeof context.safeReply === 'function'
                ? context.safeReply
                : (s, jid, content, opts) => s.sendMessage(jid, content, opts);

        await setUnmuteAsync(chatId);

        const sentMsg = await safeReply(
            sock,
            chatId,
            { text: '✧ ¡Ya volví a charlar por aquí! ¿De qué estábamos hablando? ✨😄' },
            { quoted: m }
        );
        trackBotSentMessage?.(sentMsg?.key);
        return true;
    },

    isChatMuted,
    unmuteChat
};
