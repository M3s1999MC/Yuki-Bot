module.exports = {
    name: 'clashroyale',
    aliases: ['cr'],
    category: 'gacha',
    description: 'Genera una carta al azar para reclamar con .desbloquear.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;

        const cartas = [
            { nombre: 'Caballero', id: 'CR-001', rareza: 'Común', poder: 180, img: 'https://royaleapi.com/static/img/cards-150/knight.png' },
            { nombre: 'P.E.K.K.A', id: 'CR-014', rareza: 'Épica', poder: 620, img: 'https://royaleapi.com/static/img/cards-150/pekka.png' },
            { nombre: 'Megacaballero', id: 'CR-030', rareza: 'Legendaria', poder: 890, img: 'https://royaleapi.com/static/img/cards-150/mega-knight.png' }
        ];

        const selected = cartas[Math.floor(Math.random() * cartas.length)];

        const caption = `(「✿」 "COFRE DE ARENA"🌸)\n\n` +
                        `🎴 *Carta:* ${selected.nombre}\n` +
                        `🆔 *ID:* \`${selected.id}\`\n` +
                        `✨ *Rareza:* ${selected.rareza} | ⚔️ *Poder:* ${selected.poder}\n\n` +
                        `⏳ Usa *!desbloquear* para añadirla a tu mazo.`;

        await sock.sendMessage(jid, {
            image: { url: selected.img },
            caption: caption
        }, { quoted: m });
    }
};
