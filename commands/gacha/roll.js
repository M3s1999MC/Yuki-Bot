const db = require('../../database/db');
const activeSpawns = require('../../utils/gachaSpawns');
const { searchPinterestImage } = require('../../utils/imageSearch');
const { getFallbackCharacterImage } = require('../../utils/characterImages');
const { getRandomAnimeCharacter } = require('../../utils/animeCharacter');

module.exports = {
    name: 'roll',
    aliases: ['rw', 'rollwaifu'],
    category: 'gacha',
    description: 'Invoca un personaje del catálogo gacha.',

    async execute(sock, m) {
        const jid = m.key.remoteJid;
        db.all(`SELECT id, name, serie, price, image_url FROM characters`, [], async (err, characters) => {
            if (err) {
                console.error('Error al consultar el catálogo gacha:', err.message);
                return sock.sendMessage(jid, { text: '「✿」 No pude consultar el catálogo gacha.' }, { quoted: m });
            }
            if (!characters.length) {
                return sock.sendMessage(jid, { text: '「✿」 El catálogo está vacío por ahora. 🌸' }, { quoted: m });
            }

            let character;
            let image;
            try {
                character = await getRandomAnimeCharacter();
            } catch (internetErr) {
                console.error('No se pudo obtener un personaje de anime en línea:', internetErr.message);
                character = characters[Math.floor(Math.random() * characters.length)];
            }

            try {
                const pinterestResult = await searchPinterestImage(
                    `${character.name} ${character.serie} anime character official art`
                );
                image = pinterestResult.buffer;
                character.image_url = pinterestResult.url;
            } catch (internetErr) {
                console.error(`No se pudo obtener imagen de Pinterest para ${character.name}:`, internetErr.message);
            }

            if (!image) {
                try {
                    image = await getFallbackCharacterImage();
                } catch (fallbackErr) {
                    console.error('No se pudo obtener la imagen de respaldo:', fallbackErr.message);
                }
            }
            activeSpawns.set(jid, character);
            const caption = `「✿」 ¡Apareció un personaje! 🌸\n\n` +
                `👤 *${character.name}*\n` +
                `📚 ${character.serie}\n` +
                `🎭 Rol: ${character.role || 'Personaje'}\n` +
                `💎 Valor: *${Number(character.price || 0).toLocaleString('es-CO')}*\n\n` +
                `Responde a este mensaje con !claim para reclamarlo.`;

            if (!image) {
                try {
                    image = await getFallbackCharacterImage();
                } catch (fallbackErr) {
                    console.error(`No se pudo obtener una imagen válida para ${character.name}:`, fallbackErr.message);
                }
            }

            if (!image) {
                return sock.sendMessage(jid, { text: caption }, { quoted: m });
            }

            try {
                await sock.sendMessage(jid, { image, caption }, { quoted: m });
            } catch (sendErr) {
                console.error('No se pudo enviar la imagen del personaje; intentando respaldo:', sendErr.message);
                try {
                    const fallbackImage = await getFallbackCharacterImage();
                    await sock.sendMessage(jid, { image: fallbackImage, caption }, { quoted: m });
                } catch (fallbackErr) {
                    console.error('No se pudo enviar la imagen de respaldo del personaje:', fallbackErr.message);
                    await sock.sendMessage(jid, { text: caption }, { quoted: m });
                }
            }
        });
    }
};
