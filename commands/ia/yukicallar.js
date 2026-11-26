const { muteChat, trackBotSentMessage } = require('../../handlers/aiChat');

// Espera a que muteChat confirme el guardado en BD (máx. 8 s para no dejar el comando colgado).
function setMuteAsync(chatId) {
    return new Promise((resolve) => {
        const timer = setTimeout(() => resolve(false), 8000);
        muteChat(chatId, (ok) => {
            clearTimeout(timer);
            resolve(Boolean(ok));
        });
    });
}

module.exports = {
    name: 'yukicallar',
    aliases: ['callaryuki', 'silenciayuki', 'muteai'],
    category: 'ia',
    description: 'Calla solo la IA de Yuki en este chat (persistente en BD).',
    // Evita que cualquier miembro pueda silenciar la IA. Quita esta línea si quieres que sea libre.
    adminOnly: true,

    async execute(sock, m, args = []) {
        const jid = m?.key?.remoteJid;
        if (!jid) return;

        console.log('🔇 [yukicallar] Ejecutando en:', jid);

        const persisted = await setMuteAsync(jid);
        if (!persisted) {
            console.error('⚠️ [yukicallar] La IA quedó muteada en memoria, pero no se confirmó el guardado en BD:', jid);
        }

        const text = persisted
            ? '˚₊· Vale, me quedo calladita en la IA por aquí, pero sigo activa para comandos 🙈🍞'
            : '˚₊· Me quedo calladita en la IA por ahora, pero no pude guardarlo en la base de datos: si me reinician, vuelvo a hablar 🙈';

        const sentMsg = await sock.sendMessage(jid, { text }, { quoted: m });
        trackBotSentMessage?.(sentMsg?.key);
    }
};
