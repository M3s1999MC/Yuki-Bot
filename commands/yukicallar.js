const { muteChat, unmuteChat, trackBotSentMessage } = require('../handlers/aiChat');

module.exports = {
    name: 'yukicallar',
    aliases: ['callaryuki', 'silenciayuki', 'muteai', 'yukihablar', 'hablaryuki', 'desmutear', 'unmuteai'],
    description: 'Silencia o reactiva solo la IA de Yuki en el chat o grupo actual',

    async execute(sock, m, args, context = {}) {
        const chatId = m.key?.remoteJid;
        if (!chatId) return;

        const safeReply =
            context.safeReply ||
            ((s, jid, content, opts) => s.sendMessage(jid, content, opts));

        const rawText = (
            context.body ||
            m.message?.conversation ||
            m.message?.extendedTextMessage?.text ||
            ''
        )
            .trim()
            .toLowerCase();

        const isUnmute = /^[!/.]?(yukihablar|hablaryuki|desmutear|unmuteai)\b/i.test(rawText);

        if (isUnmute) {
            unmuteChat(chatId);
            const sentMsg = await safeReply(
                sock,
                chatId,
                { text: '✧ ¡Volví a charlar! ¿De qué estábamos hablando? ✨😄' },
                { quoted: m }
            );
            trackBotSentMessage?.(sentMsg?.key);
            return;
        }

        muteChat(chatId);
        const sentMsg = await safeReply(
            sock,
            chatId,
            { text: '˚₊· Vale, me callo la IA por aquí un ratito, pero sigo atenta a comandos 🙈🍞' },
            { quoted: m }
        );
        trackBotSentMessage?.(sentMsg?.key);
    }
};
