module.exports = {
    name: 'winfo',
    aliases: ['cooldowns', 'esperas', 'espera'],
    category: 'economy',
    description: 'Ver el tiempo de espera de los comandos.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const targetUser = m.key.participant || jid;

        const text = `(「✿」 "PANEL DE COOLDOWNS"🌸)\n\n` +
                     `👤 @${targetUser.split('@')[0]}\n\n` +
                     `💼 Trabajo: ✅ ¡Disponible!\n` +
                     `🦹‍♂️ Crimen: ⏳ 12 minutos restantes\n` +
                     `⛏️ Minería: ✅ ¡Disponible!`;

        await sock.sendMessage(jid, { text, mentions: [targetUser] }, { quoted: m });
    }
};
