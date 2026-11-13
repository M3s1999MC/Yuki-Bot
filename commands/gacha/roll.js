const { random } = require('jikan-nodejs');
const db = require('../../database/db'); // Ajusta la ruta a tu archivo db.js según dónde esté tu comando

// Función para obtener o guardar el personaje aleatorio de Jikan
async function getOrSaveRandomCharacter() {
    try {
        const response = await random.random('characters');
        const char = response.data;
        
        const malId = char.mal_id;
        const name = char.name;
        const image = char.images.jpg.image_url;
        const anime = char.anime[0]?.anime?.name || "Original / Desconocido";

        // Si estás usando SQLite local
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

// Dentro de tu comando execute (o handler de tu bot):
async function execute(sock, m, args) {
    const jid = m.key.remoteJid;

    try {
        // Mensaje de carga opcional
        await sock.sendMessage(jid, { text: '「✿」 Buscando personaje en el multiverso del anime... 🌸' }, { quoted: m });

        const character = await getOrSaveRandomCharacter();

        if (!character) {
            return await sock.sendMessage(jid, { text: '「✿」 Ups, la API de Jikan tardó en responder o hubo un error. Inténtalo de nuevo. 🌸' }, { quoted: m });
        }

        // Enviamos la imagen y los datos del personaje con el formato oficial de Yuki
        await sock.sendMessage(jid, {
            image: { url: character.image },
            caption: `「✿」 **¡HAS OBTENIDO UN PERSONAJE!** 🌸\n\n` +
                     `• **Nombre:** ${character.name}\n` +
                     `• **Anime:** ${character.anime}\n\n` +
                     `💡 Usa tu comando de claim para reclamarlo a tu harem.`
        }, { quoted: m });

    } catch (error) {
        console.error('Error en el comando roll:', error);
        await sock.sendMessage(jid, { text: '「✿」 Ocurrió un error inesperado al tirar el gacha. 🌸' }, { quoted: m });
    }
}

module.exports = { execute };
