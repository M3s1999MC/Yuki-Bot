module.exports = {
    name: 'snake',
    aliases: ['gusanito'],
    category: 'gacha',
    description: 'Genera un gusanito (skin de Snake) al azar para adoptar con .adoptar.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;

        const snakes = [
            { nombre: 'Gusanito Neón', id: 'SN-001', rareza: 'Raro', poder: 200, img: 'https://i.pinimg.com/736x/87/46/7c/87467c645b20626359508d8175d3369b.jpg' },
            { nombre: 'Cobra Galáctica', id: 'SN-009', rareza: 'Mítico', poder: 740, img: 'https://i.pinimg.com/736x/e2/29/70/e2297072a74c4310d481b2120e2ef59c.jpg' }
        ];

        const selected = snakes[Math.floor(Math.random() * snakes.length)];

        const caption = `(「✿」 "NIDO DE GUSANITOS"🌸)\n\n` +
                        `🎴 *Snake:* ${selected.nombre}\n` +
                        `🆔 *ID:* \`${selected.id}\`\n` +
                        `✨ *Rareza:* ${selected.rareza} | ⚔️ *Poder:* ${selected.poder}\n\n` +
                        `⏳ Usa *!adoptar* para llevarlo a tu terrario.`;

        await sock.sendMessage(jid, {
            image: { url: selected.img },
            caption: caption
        }, { quoted: m });
    }
};
