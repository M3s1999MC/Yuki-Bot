const db = require('../../database/db');
const activeSpawns = require('../../utils/gachaSpawns');
const {
    fetchPinterestImage,
    resolvePinterestImageUrl
} = require('../../utils/imageSearch');

module.exports = {
    name: 'roll',
    aliases: ['rw', 'rollwaifu', 'waifu'],
    category: 'gacha',
    description: 'Invoca un personaje del catálogo gacha con su imagen configurada.',

    async execute(sock, m) {
        const jid = m.key.remoteJid;
        db.all(
            `SELECT id, name, serie, price, image_url
             FROM characters
             WHERE is_curated = 1
             ORDER BY name COLLATE NOCASE`,
            [],
            async (err, characters) => {
                if (err) {
                    console.error('Error al consultar el catálogo gacha:', err.message);
                    return sock.sendMessage(jid, { text: '「✿」 No pude consultar el catálogo gacha.' }, { quoted: m });
                }

                if (!characters.length) {
                    return sock.sendMessage(jid, { text: '「✿」 El catálogo seleccionado todavía no está disponible.' }, { quoted: m });
                }

                const configured = characters.filter(character =>
                    typeof character.image_url === 'string' && character.image_url.trim()
                );
                if (!configured.length) {
                    return sock.sendMessage(jid, {
                        text: `「✿」 El catálogo ya tiene ${characters.length} personajes, pero aún no hay imágenes configuradas. El dueño puede añadir sus URLs en utils/gachaRoster.js; usa !rollcatalog para ver la lista.`
                    }, { quoted: m });
                }

                const character = configured[Math.floor(Math.random() * configured.length)];
                let image;
                let imageUrl;
                try {
                    imageUrl = await resolvePinterestImageUrl(character.image_url);
                    image = await fetchPinterestImage(imageUrl);
                } catch (imageErr) {
                    console.error(`No se pudo descargar la imagen configurada de ${character.name}:`, imageErr.message);
                    return sock.sendMessage(jid, {
                        text: `「✿」 No pude cargar la imagen configurada de *${character.name}*. El enlace puede estar vencido; el dueño debe revisarlo en utils/gachaRoster.js.`
                    }, { quoted: m });
                }

                const caption = `「✿」 ¡Apareció un personaje! 🌸\n\n` +
                    `👤 *${character.name}*\n` +
                    `📚 ${character.serie}\n` +
                    `💎 Valor: *${Number(character.price || 0).toLocaleString('es-CO')}*\n\n` +
                    `Responde a este mensaje con !claim para reclamarlo.`;
                try {
                    await sock.sendMessage(jid, { image, caption }, { quoted: m });
                } catch (sendErr) {
                    console.error(`No se pudo enviar la imagen de ${character.name}:`, sendErr.message);
                    return sock.sendMessage(jid, {
                        text: `「✿」 No se pudo enviar la imagen de *${character.name}*. Inténtalo otra vez.`
                    }, { quoted: m });
                }

                activeSpawns.set(jid, { ...character, image_url: imageUrl });
            }
        );
    }
};
