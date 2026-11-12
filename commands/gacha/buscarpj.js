module.exports = {
    name: 'buscarpj',
    aliases: ['buscarpersonaje', 'pj'],
    category: 'gacha',
    description: 'Busca un personaje por nombre en cualquier categoría del gacha.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const consulta = args.join(' ');

        if (!consulta) {
            return await sock.sendMessage(jid, {
                text: '(「✿」 "BUSCADOR DE CATÁLOGO"🌸)\n\n⚠️ Escribe el nombre o categoría del personaje.\n*Uso:* `!buscarpj [categoría] <nombre>`'
            }, { quoted: m });
        }

        // TODO: Consultar en Neon/Postgres (SELECT * FROM gacha_catalog WHERE name ILIKE $1)
        const text = `(「✿」 "RESULTADOS DE BÚSQUEDA"🌸)\n\n` +
                     `🔎 *Consulta:* ${consulta}\n\n` +
                     `1. \`[PK-006]\` **Charizard** — Pokémon (Épico)\n` +
                     `2. \`[BS-012]\` **Spike** — Brawl Stars (Legendario)`;

        await sock.sendMessage(jid, { text }, { quoted: m });
    }
};
