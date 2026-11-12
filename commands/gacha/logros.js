module.exports = {
    name: 'logros',
    aliases: ['achievements'],
    category: 'gacha',
    description: 'Tu panel de logros y misiones especiales.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || jid;

        const text = `(「✿」 "PANEL DE LOGROS"🌸)\n\n` +
                     `👤 @${sender.split('@')[0]}\n\n` +
                     `🎃 *Misión Halloween:* [✓ Completado]\n` +
                     `⭐ *Coleccionista Épico:* [45 / 50]\n` +
                     `⚔️ *Veterano PvP:* [12 / 20 Victorias]`;

        await sock.sendMessage(jid, { text, mentions: [sender] }, { quoted: m });
    }
};
