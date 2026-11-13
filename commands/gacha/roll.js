const axios = require('axios'); // Asegúrate de tener axios instalado, o usa fetch nativo de Node.js
const db = require('../../database/db');

async function getOrSaveRandomCharacter() {
    try {
        // Petición directa a la API pública de Jikan (v4)
        const response = await axios.get('https://api.jikan.moe/v4/random/characters', { timeout: 10000 });
        const char = response.data.data;
        
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
        console.error('Error directo en Jikan API:', error.message);
        throw new Error(`Fallo en Jikan: ${error.message}`);
    }
}
