const { muteChat, unmuteChat, trackBotSentMessage } = require('../handlers/aiChat');

function setMuteAsync(fn, chatId) {
    return new Promise((resolve) => {
        fn(chatId, (ok) => resolve(ok));
    });
}

module.exports = {
    name: 'yukicallar',
    aliases: ['callaryuki', 'silenciayuki', 'muteai'],
    category: 'ia',
    description: 'Calla solo la IA de Yuki en este chat (persistente en BD).',

    async execute(sock, m, args = []) {
        const jid = m?.key?.remoteJid;
        if (!jid) return;

        console.log('🔇 [yukicallar] Ejecutando en:', jid);

        await setMuteAsync(muteChat, jid);

        const sentMsg = await sock.sendMessage(
            jid,
            { text: '˚₊· Vale, me quedo calladita en la IA por aquí, pero sigo activa para comandos 🙈🍞' },
            { quoted: m }
        );
        trackBotSentMessage?.(sentMsg?.key);
    }
};
