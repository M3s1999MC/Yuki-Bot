module.exports = {
    name: 'dragon',
    aliases: ['dragonmania'],
    category: 'gacha',
    description: 'Genera un dragón al azar para reclamar con .criar.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;

        const text = `(「✿」 "HUEVO MISTERIOSO"🌸)\n\n` +
                     `🎴 *Dragón:* Dragón Cronos\n` +
                     `🆔 *ID:* \`DR-022\`\n` +
                     `✨ *Rareza:* Divino | ⚔️ *Poder:* 980\n\n` +
                     `⏳ Usa *!criar* para incubar este dragón.`;

        await sock.sendMessage(jid, { text }, { quoted: m });
    }
};
