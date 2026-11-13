const axios = require('axios');

// Jikan API base URL
const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';

/**
 * Busca personajes aleatorios o de una serie específica
 */
async function getRandomCharacter() {
    try {
        // Jikan tiene un endpoint para personajes aleatorios
        const response = await axios.get(`${JIKAN_BASE_URL}/random/characters`);
        const charData = response.data.data;

        return {
            name: charData.name,
            image: charData.images.jpg.image_url,
            anime: charData.anime[0]?.anime?.name || "Desconocido",
            about: charData.about ? charData.about.substring(0, 150) + '...' : 'Sin descripción.'
        };
    } catch (error) {
        console.error('Error al obtener personaje de Jikan:', error.message);
        return null;
    }
}

async function searchCharacter(query) {
    try {
        const response = await axios.get(`${JIKAN_BASE_URL}/characters`, {
            params: { q: query, limit: 1 }
        });
        
        if (!response.data.data.length) return null;
        
        const charData = response.data.data[0];
        return {
            name: charData.name,
            image: charData.images.jpg.image_url,
            anime: charData.anime[0]?.anime?.name || "Desconocido"
        };
    } catch (error) {
        console.error('Error al buscar personaje en Jikan:', error.message);
        return null;
    }
}

module.exports = { getRandomCharacter, searchCharacter };
