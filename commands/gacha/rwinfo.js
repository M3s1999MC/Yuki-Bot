module.exports = {
    name: 'rwinfo',
    aliases: ['gachacd', 'cooldownsgacha'],
    category: 'gacha',
    description: 'Muestra el tiempo de espera de las tiradas de todos los gachas.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const targetUser = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.key.participant || jid;

        const text = `(「✿」 "ENFRIAMIENTOS DE TIRADAS"🌸)\n\n` +
                     `👤 *Usuario:* @${targetUser.split('@')[0]}\n\n` +
                     `⚡ *Pokémon (.pokemon):* ✅ Disponible\n` +
                     `🔫 *Brawl Stars (.brawl):* ⏳ 14 min restantes\n` +
                     `🐍 *Snakes (.snake):* ✅ Disponible\n` +
                     `👑 *Clash Royale (.cr):* ✅ Disponible\n` +
                     `🎖️ *Call of Duty (.cod):* ⏳ 8 min restantes\n` +
                     `🐉 *Dragon Mania (.dragon):* ✅ Disponible`;

        await sock.sendMessage(jid, { text, mentions: [targetUser] }, { quoted: m });
    }
};
