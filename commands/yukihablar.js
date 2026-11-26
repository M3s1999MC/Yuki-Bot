const { unmuteChat, trackBotSentMessage } = require('../handlers/aiChat');

module.exports = {
    name: 'yukihablar',
    aliases: ['hablaryuki', 'desmutear', 'unmuteai'],
    description: 'Reactiva la IA de Yuki en el chat o grupo actual',

    async execute(sock, m, args, context = {}) {
        const chatId = m.key?.remoteJid;
        if (!chatId) return;

        const safeReply =
            context.safeReply ||
            ((s, jid, content, opts) => s.sendMessage(jid, content, opts));

        unmuteChat(chatId);
        const sentMsg = await safeReply(
            sock,
            chatId,
            { text: '✧ ¡Volví a charlar! ¿De qué estábamos hablando? ✨😄' },
            { quoted: m }
        );
        trackBotSentMessage?.(sentMsg?.key);
    }
};
