const db = require('../../database/db');
const { getFallbackCharacterImage } = require('../../utils/characterImages');

module.exports = {
    name: 'charinfo',
    aliases: [
        'winfo', 'waifuinfo', 'serieinfo', 'ainfo', 'animeinfo',
        'charimage', 'waifuimage', 'cimage', 'wimage'
    ],
    category: 'gacha',
    description: 'Consulta personajes, series o una imagen aleatoria del catálogo.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const body = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const command = body.replace(/^!/, '').trim().split(/\s+/)[0].toLowerCase();
        const query = args.join(' ').trim();
        const isImage = ['charimage', 'waifuimage', 'cimage', 'wimage'].includes(command);
        const isSeries = ['serieinfo', 'ainfo', 'animeinfo'].includes(command);
        if (!query && !isImage) {
            return sock.sendMessage(jid, { text: `「✿」 Indica el nombre del ${isSeries ? 'anime o serie' : 'personaje'} que quieres consultar.` }, { quoted: m });
        }

        const sql = query
            ? `SELECT id, name, serie, price, image_url FROM characters WHERE ${isSeries ? 'serie' : 'name'} LIKE ? COLLATE NOCASE ORDER BY name COLLATE NOCASE LIMIT 20`
            : `SELECT id, name, serie, price, image_url FROM characters ORDER BY RANDOM() LIMIT 1`;
        db.all(sql, query ? [`%${query}%`] : [], async (err, characters) => {
            if (err) {
                console.error('Error al consultar información de personaje:', err.message);
                return sock.sendMessage(jid, { text: '「✿」 No pude consultar el catálogo gacha.' }, { quoted: m });
            }
            if (!characters.length && isImage && !query) {
                try {
                    const image = await getFallbackCharacterImage();
                    return await sock.sendMessage(jid, { image, caption: '「✿」 Imagen aleatoria de personaje 🌸' }, { quoted: m });
                } catch (imageErr) {
                    console.error('Error al obtener imagen aleatoria:', imageErr.message);
                }
            }
            if (!characters.length) {
                return sock.sendMessage(jid, { text: `「✿」 No encontré resultados para _${query}_.` }, { quoted: m });
            }

            if (isImage) {
                const character = characters[Math.floor(Math.random() * characters.length)];
                try {
                    if (!character.image_url) throw new Error('El personaje no tiene imagen.');
                    return await sock.sendMessage(jid, {
                        image: { url: character.image_url },
                        caption: `「✿」 *${character.name}* · ${character.serie} 🌸`
                    }, { quoted: m });
                } catch (sendErr) {
                    console.error('Error al enviar imagen de personaje:', sendErr);
                    try {
                        const image = await getFallbackCharacterImage();
                        return await sock.sendMessage(jid, { image, caption: `「✿」 Imagen alternativa · *${character.name}* 🌸` }, { quoted: m });
                    } catch (fallbackErr) {
                        console.error('Error en fuente alternativa de imágenes:', fallbackErr.message);
                    }
                }
                return sock.sendMessage(jid, { text: '「✿」 No pude obtener la imagen. Revisa la URL del catálogo o inténtalo más tarde.' }, { quoted: m });
            }

            const text = isSeries
                ? `「✿」 Serie: *${query}* 🌸\n\n${characters.map(character => `#${character.id} · ${character.name} · 💎 ${Number(character.price || 0).toLocaleString('es-CO')}`).join('\n')}`
                : `「✿」 Información de personaje 🌸\n\n${characters.map(character =>
                    `#${character.id} · *${character.name}*\n📚 ${character.serie}\n💎 Valor: ${Number(character.price || 0).toLocaleString('es-CO')}`
                ).join('\n\n')}`;
            sock.sendMessage(jid, { text }, { quoted: m });
        });
    }
};
