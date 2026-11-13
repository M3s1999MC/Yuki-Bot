const { random } = require('jikan-nodejs');
const db = require('../../database/db');

async function getOrSaveRandomCharacter() {
    try {
        const response = await random.random('characters');
        const char = response.data;
        
        const malId = char.mal_id;
        const name = char.name;
        const image = char.images.jpg.image_url;
        const anime = char.anime[0]?.anime?.name || "Original / Desconocido";

        return new Promise((resolve, reject) => {
            db.get(`SELECT * FROM gacha_characters WHERE mal_id = ?`, [malId], (err, row) => {
                if (err) return reject(err);
                
                if (row) {
                    resolve(row); // Ya existe en la base de datos local
                } else {
                    db.run(
                        `INSERT INTO gacha_characters (mal_id, name, image, anime) VALUES (?, ?, ?, ?)`,
                        [malId, name, image, anime],
                        (insertErr) => {
                            if (insertErr) return reject(insertErr);
                            resolve({ mal_id: malId, name, image, anime });
                        }
                    );
                }
            });
        });

    } catch (error) {
        console.error('Error al obtener personaje con Jikan:', error.message);
        return null;
    }
}

module.exports = {
    name: 'roll',
    aliases: ['rw', 'rollwaifu', 'waifu'],
    category: 'gacha',
    description: 'Tira un personaje de la API de Jikan de forma dinámica y lo guarda en la base de datos.',

    async execute(sock, m, args) {
        if (m.isProcessed) return;
        m.isProcessed = true;

        const jid = m.key.remoteJid;

        try {
            await sock.sendMessage(jid, { text: '「✿」 Buscando personaje en el multiverso del anime... 🌸' }, { quoted: m });

            const character = await getOrSaveRandomCharacter();

            if (!character) {
                return await sock.sendMessage(jid, { text: '「✿」 Ups, la API de Jikan tardó en responder o hubo un error. Inténtalo de nuevo. 🌸' }, { quoted: m });
            }

            await sock.sendMessage(jid, {
                image: { url: character.image },
                caption: `「✿」 **¡HAS OBTENIDO UN PERSONAJE!** 🌸\n\n` +
                         `• **Nombre:** ${character.name}\n` +
                         `• **Anime:** ${character.anime}\n\n` +
                         `💡 Usa tu comando de claim para reclamarlo a tu harem.`
            }, { quoted: m });

        } catch (error) {
            console.error('Error en el comando roll:', error.message);
            await sock.sendMessage(jid, { text: '「✿」 Ocurrió un error inesperado al tirar el gacha. 🌸' }, { quoted: m });
        }
    }
};
