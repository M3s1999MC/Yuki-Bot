const { random } = require('jikan-nodejs'); // Módulo de personajes/aleatorios del wrapper
const db = require('./db'); // Conexión a Neon/PostgreSQL (db.js dentro de la misma carpeta database)

async function getOrSaveRandomCharacter() {
    try {
        // 1. Pedimos un personaje aleatorio usando la librería del repositorio
        // (Dependiendo de la versión del wrapper, suele tener un método para random o personajes)
        const response = await random.random('characters');
        const char = response.data;
        
        const malId = char.mal_id;
        const name = char.name;
        const image = char.images.jpg.image_url;
        const anime = char.anime[0]?.anime?.name || "Original / Desconocido";

        // 2. Verificamos si ya lo tenemos guardado en nuestra base de datos local
        let queryCheck = 'SELECT * FROM gacha_characters WHERE mal_id = $1';
        let result = await db.query(queryCheck, [malId]);

        if (result.rows.length > 0) {
            // Ya existe en la BD local, lo devolvemos directo de la BD (cero llamadas extra a la API)
            return result.rows[0];
        } else {
            // 3. Si no existe, lo guardamos automáticamente en la BD para las próximas veces
            let queryInsert = `
                INSERT INTO gacha_characters (mal_id, name, image, anime) 
                VALUES ($1, $2, $3, $4) 
                RETURNING *;
            `;
            let newChar = await db.query(queryInsert, [malId, name, image, anime]);
            return newChar.rows[0];
        }

    } catch (error) {
        console.error('Error al obtener personaje con jikan-nodejs:', error.message);
        return null;
    }
}

module.exports = { getOrSaveRandomCharacter };
