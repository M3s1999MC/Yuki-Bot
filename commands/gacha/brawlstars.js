module.exports = {
    name: 'brawlstars',
    aliases: ['brawl'],
    category: 'gacha',
    description: 'Genera un Brawler al azar para reclamar con .drop.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;

        const brawlers = [
            { nombre: 'Shelly', id: 'BS-001', rareza: 'Inicial', poder: 150, img: 'https://cdn.brawlify.com/brawlers/borderless/16000000.png' },
            { nombre: 'Spike', id: 'BS-012', rareza: 'Legendario', poder: 880, img: 'https://cdn.brawlify.com/brawlers/borderless/16000004.png' },
            { nombre: 'Leon', id: 'BS-025', rareza: 'Legendario', poder: 860, img: 'https://cdn.brawlify.com/brawlers/borderless/16000027.png' }
        ];

        const selected = brawlers[Math.floor(Math.random() * brawlers.length)];

        const caption = `(「✿」 "CAJA BRAWL ABIERTA"🌸)\n\n` +
                        `🎴 *Brawler:* ${selected.nombre}\n` +
                        `🆔 *ID:* \`${selected.id}\`\n` +
                        `✨ *Rareza:* ${selected.rareza} | ⚔️ *Poder:* ${selected.poder}\n\n` +
                        `⏳ Usa *!drop* para reclamar este Brawler.`;

        await sock.sendMessage(jid, {
            image: { url: selected.img },
            caption: caption
        }, { quoted: m });
    }
};
