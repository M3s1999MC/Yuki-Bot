const { unmuteChat, trackBotSentMessage } = require('../handlers/aiChat');

function setUnmuteAsync(chatId) {
    return new Promise((resolve) => {
        unmuteChat(chatId, (ok) => resolve(ok));
    });
}

module.exports = {
    name: 'yukihablar',
    aliases: ['hablaryuki', 'desmutear', 'unmuteai'],
    category: 'ia',
    description: 'Vuelve a activar solo la IA de Yuki en este chat (persistente en BD).',

    async execute(sock, m, args = []) {
        const jid = m?.key?.remoteJid;
        if (!jid) return;

        console.log('🔊 [yukihablar] Ejecutando en:', jid);

        await setUnmuteAsync(jid);

        const sentMsg = await sock.sendMessage(
            jid,
            { text: '✧ ¡Ya volví a charlar por aquí! ¿De qué estábamos hablando? ✨😄' },
            { quoted: m }
        );
        trackBotSentMessage?.(sentMsg?.key);
    }
};
