module.exports = {
    name: 'pokemon',
    category: 'gacha',
    description: 'Genera un Pokémon al azar para reclamar con .atrapar (cada 20 minutos).',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;

        const text = `(「✿」 "APARICIÓN SALVAJE"🌸)\n\n` +
                     `🎴 *Pokémon:* Charizard\n` +
                     `🆔 *ID:* \`PK-006\`\n` +
                     `✨ *Rareza:* Épico | ⚔️ *Poder:* 450\n\n` +
                     `⏳ Usa *!atrapar* para capturarlo antes de que huya.`;

        await sock.sendMessage(jid, { text }, { quoted: m });
    }
};
