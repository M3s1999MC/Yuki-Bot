module.exports = {
    name: 'clashroyale',
    aliases: ['cr'],
    category: 'gacha',
    description: 'Genera una carta al azar para reclamar con .desbloquear.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;

        const text = `(「✿」 "COFRE DE ARENA"🌸)\n\n` +
                     `🎴 *Carta:* Megacaballero\n` +
                     `🆔 *ID:* \`CR-030\`\n` +
                     `✨ *Rareza:* Legendaria | ⚔️ *Poder:* 890\n\n` +
                     `⏳ Usa *!desbloquear* para añadirla a tu mazo.`;

        await sock.sendMessage(jid, { text }, { quoted: m });
    }
};
