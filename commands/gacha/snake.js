module.exports = {
    name: 'snake',
    aliases: ['gusanito'],
    category: 'gacha',
    description: 'Genera un gusanito (skin de Snake) al azar para adoptar con .adoptar.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;

        const text = `(「✿」 "NIDO DE GUSANITOS"🌸)\n\n` +
                     `🎴 *Snake:* Gusanito Neón\n` +
                     `🆔 *ID:* \`SN-001\`\n` +
                     `✨ *Rareza:* Raro | ⚔️ *Poder:* 200\n\n` +
                     `⏳ Usa *!adoptar* para llevarlo a tu terrario.`;

        await sock.sendMessage(jid, { text }, { quoted: m });
    }
};
