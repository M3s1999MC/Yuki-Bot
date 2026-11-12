module.exports = {
    name: 'pokemon',
    category: 'gacha',
    description: 'Genera un Pokémon al azar para reclamar con .atrapar (cada 20 minutos).',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;

        // Variedad de Pokémon en el pool de tirada
        const pokemons = [
            { nombre: 'Pikachu', id: 'PK-025', rareza: 'Común', poder: 120, img: 'https://images.wikidexcdn.net/mw/images/thumb/7/77/latest/20150622194454/Pikachu.png' },
            { nombre: 'Charizard', id: 'PK-006', rareza: 'Épico', poder: 450, img: 'https://images.wikidexcdn.net/mw/images/thumb/8/8a/latest/20160309224214/Charizard.png' },
            { nombre: 'Mewtwo', id: 'PK-150', rareza: 'Legendario', poder: 920, img: 'https://images.wikidexcdn.net/mw/images/thumb/a/a2/latest/20150621213344/Mewtwo.png' }
        ];

        const selected = pokemons[Math.floor(Math.random() * pokemons.length)];

        const caption = `(「✿」 "APARICIÓN SALVAJE"🌸)\n\n` +
                        `🎴 *Pokémon:* ${selected.nombre}\n` +
                        `🆔 *ID:* \`${selected.id}\`\n` +
                        `✨ *Rareza:* ${selected.rareza} | ⚔️ *Poder:* ${selected.poder}\n\n` +
                        `⏳ Usa *!atrapar* para capturarlo antes de que huya.`;

        await sock.sendMessage(jid, {
            image: { url: selected.img },
            caption: caption
        }, { quoted: m });
    }
};
