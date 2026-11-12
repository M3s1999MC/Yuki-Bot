module.exports = {
    name: 'brawlstars',
    aliases: ['brawl'],
    category: 'gacha',
    description: 'Genera un Brawler al azar para reclamar con .drop.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;

        const text = `(「✿」 "CAJA BRAWL ABIERTA"🌸)\n\n` +
                     `🎴 *Brawler:* Spike\n` +
                     `🆔 *ID:* \`BS-012\`\n` +
                     `✨ *Rareza:* Legendario | ⚔️ *Poder:* 880\n\n` +
                     `⏳ Usa *!drop* para reclamar este Brawler.`;

        await sock.sendMessage(jid, { text }, { quoted: m });
    }
};
