module.exports = {
    name: 'callofduty',
    aliases: ['cod'],
    category: 'gacha',
    description: 'Genera un ítem de COD al azar para reclamar con .equipar.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;

        const text = `(「✿」 "SUMINISTRO TÁCTICO"🌸)\n\n` +
                     `🎴 *Ítems:* AK-47 Radiance\n` +
                     `🆔 *ID:* \`CD-010\`\n` +
                     `✨ *Rareza:* Mítica | ⚔️ *Poder:* 950\n\n` +
                     `⏳ Usa *!equipar* para guardar este ítem en tu armería.`;

        await sock.sendMessage(jid, { text }, { quoted: m });
    }
};
