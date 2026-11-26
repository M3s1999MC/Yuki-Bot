const { unmuteChat, trackBotSentMessage } = require('../../handlers/aiChat');

// Espera a que unmuteChat confirme el guardado en BD (máx. 8 s para no dejar el comando colgado).
function setUnmuteAsync(chatId) {
    return new Promise((resolve) => {
        const timer = setTimeout(() => resolve(false), 8000);
        unmuteChat(chatId, (ok) => {
            clearTimeout(timer);
            resolve(Boolean(ok));
        });
    });
}

module.exports = {
    name: 'yukihablar',
    aliases: ['hablaryuki', 'desmutear', 'unmuteai'],
    category: 'ia',
    description: 'Vuelve a activar solo la IA de Yuki en este chat (persistente en BD).',
    // Evita que cualquier miembro pueda reactivar la IA. Quita esta línea si quieres que sea libre.
    adminOnly: true,

    async execute(sock, m, args = []) {
        const jid = m?.key?.remoteJid;
        if (!jid) return;

        console.log('🔊 [yukihablar] Ejecutando en:', jid);

        const persisted = await setUnmuteAsync(jid);
        if (!persisted) {
            console.error('⚠️ [yukihablar] La IA se reactivó en memoria, pero no se confirmó el guardado en BD:', jid);
        }

        const text = persisted
            ? '✧ ¡Ya volví a charlar por aquí! ¿De qué estábamos hablando? ✨😄'
            : '✧ ¡Ya volví a charlar por aquí! (no pude guardarlo en la base de datos, así que si me reinician podría quedar callada otra vez) ✨';

        const sentMsg = await sock.sendMessage(jid, { text }, { quoted: m });
        trackBotSentMessage?.(sentMsg?.key);
    }
};
