module.exports = {
    name: 'perfilgacha',
    aliases: ['gachaperfil', 'micolecciongacha'],
    category: 'gacha',
    description: 'Muestra el perfil de coleccionista de un usuario.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const targetUser = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.key.participant || jid;

        const text = `(「✿」 "PERFIL DE COLECCIONISTA"🌸)\n\n` +
                     `👤 *Usuario:* @${targetUser.split('@')[0]}\n\n` +
                     `⚡ *Pokémon:* 12 | 🔫 *Brawlers:* 8\n` +
                     `🐍 *Snakes:* 5 | 👑 *Cartas:* 15\n` +
                     `🎖️ *COD:* 6 | 🐉 *Dragones:* 4`;

        await sock.sendMessage(jid, { text, mentions: [targetUser] }, { quoted: m });
    }
};
