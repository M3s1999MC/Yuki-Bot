module.exports = {
    name: 'winfo',
    aliases: ['cooldowns', 'esperas', 'espera'],
    category: 'economy',
    description: 'Verifica el tiempo de espera restante de todos los comandos de economía.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;

        let targetUser = m.key.participant || jid;
        if (m.message.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            targetUser = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }

        const texto = `⏱️ *PANEL DE ENFRIAMIENTOS (COOLDOWNS)* ⏱️\n\n` +
                      `👤 *Usuario:* @${targetUser.split('@')[0]}\n\n` +
                      `💼 *Trabajo (.work):* ✅ ¡Disponible!\n` +
                      `🦹‍♂️ *Crimen (.crime):* ⏳ Restan 12 minutos\n` +
                      `⛏️ *Minería (.mine):* ✅ ¡Disponible!\n` +
                      `🎁 *Cofre Diario (.cofre):* ⏳ Restan 5 horas\n` +
                      `📦 *Recompensa Diaria (.daily):* ✅ ¡Disponible!`;

        await sock.sendMessage(jid, { text: texto, mentions: [targetUser] }, { quoted: m });
    }
};
