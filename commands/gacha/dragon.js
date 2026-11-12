module.exports = {
    name: 'dragon',
    aliases: ['dragonmania'],
    category: 'gacha',
    description: 'Genera un dragón al azar para reclamar con .criar.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;

        const dragones = [
            { nombre: 'Dragón Fuego', id: 'DR-001', rareza: 'Común', poder: 140, img: 'https://i.pinimg.com/736x/77/2e/8b/772e8b23b1236ea754024508eeea7204.jpg' },
            { nombre: 'Dragón Cronos', id: 'DR-022', rareza: 'Divino', poder: 980, img: 'https://i.pinimg.com/736x/55/11/44/551144cc7728f322350a2211e4420808.jpg' }
        ];

        const selected = dragones[Math.floor(Math.random() * dragones.length)];

        const caption = `(「✿」 "HUEVO MISTERIOSO"🌸)\n\n` +
                        `🎴 *Dragón:* ${selected.nombre}\n` +
                        `🆔 *ID:* \`${selected.id}\`\n` +
                        `✨ *Rareza:* ${selected.rareza} | ⚔️ *Poder:* ${selected.poder}\n\n` +
                        `⏳ Usa *!criar* para incubar este dragón.`;

        await sock.sendMessage(jid, {
            image: { url: selected.img },
            caption: caption
        }, { quoted: m });
    }
};
