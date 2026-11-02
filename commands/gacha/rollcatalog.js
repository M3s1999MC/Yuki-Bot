const db = require('../../database/db');

module.exports = {
    name: 'rollcatalog',
    aliases: ['catalogoroll'],
    category: 'gacha',
    description: 'Muestra los personajes del catálogo y cuáles aún no tienen imagen.',

    execute(sock, m) {
        const jid = m.key.remoteJid;
        db.all(
            `SELECT name, serie, image_url
             FROM characters
             WHERE is_curated = 1
             ORDER BY serie COLLATE NOCASE, name COLLATE NOCASE`,
            [],
            (err, characters) => {
                if (err) {
                    console.error('Error al consultar el catálogo seleccionado:', err.message);
                    return sock.sendMessage(jid, { text: '「✿」 No pude consultar el catálogo.' }, { quoted: m });
                }
                if (!characters.length) {
                    return sock.sendMessage(jid, { text: '「✿」 El catálogo seleccionado todavía no está disponible.' }, { quoted: m });
                }

                const missing = characters.filter(character =>
                    typeof character.image_url !== 'string' || !character.image_url.trim()
                );
                const groups = new Map();
                for (const character of missing) {
                    if (!groups.has(character.serie)) groups.set(character.serie, []);
                    groups.get(character.serie).push(character.name);
                }

                const details = [...groups].map(([serie, names]) =>
                    `*${serie}*\n${names.map(name => `• ${name}`).join('\n')}`
                );
                const summary = `「✿」 Catálogo de !roll: ${characters.length - missing.length}/${characters.length} imágenes configuradas.`;
                const instructions = missing.length
                    ? '\n\nEl dueño puede añadir cada URL en imageUrl dentro de utils/gachaRoster.js y desplegar la actualización.'
                    : '\n\n¡Todas las imágenes están configuradas! 🌸';
                return sock.sendMessage(jid, {
                    text: `${summary}${details.length ? `\n\n${details.join('\n\n')}` : ''}${instructions}`
                }, { quoted: m });
            }
        );
    }
};
