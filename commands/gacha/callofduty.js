module.exports = {
    name: 'callofduty',
    aliases: ['cod'],
    category: 'gacha',
    description: 'Genera un ítem de COD al azar para reclamar con .equipar.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;

        const codItems = [
            { nombre: 'Ghost - Stealth', id: 'CD-001', rareza: 'Épico', poder: 550, img: 'https://i.pinimg.com/736x/3a/0c/3e/3a0c3ebaa588ef1c29e61230e521074a.jpg' },
            { nombre: 'AK-47 Radiance (Mítica)', id: 'CD-010', rareza: 'Mítica', poder: 950, img: 'https://i.pinimg.com/736x/11/39/1b/11391bde23b878345c26ef2eb5b3c3c7.jpg' }
        ];

        const selected = codItems[Math.floor(Math.random() * codItems.length)];

        const caption = `(「✿」 "SUMINISTRO TÁCTICO"🌸)\n\n` +
                        `🎴 *Ítem:* ${selected.nombre}\n` +
                        `🆔 *ID:* \`${selected.id}\`\n` +
                        `✨ *Rareza:* ${selected.rareza} | ⚔️ *Poder:* ${selected.poder}\n\n` +
                        `⏳ Usa *!equipar* para guardar este ítem en tu armería.`;

        await sock.sendMessage(jid, {
            image: { url: selected.img },
            caption: caption
        }, { quoted: m });
    }
};
