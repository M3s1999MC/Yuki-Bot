const axios = require('axios');
const https = https = require('https');
const db = require('../../database/db');

const jikanApi = axios.create({
    baseURL: 'https://api.jikan.moe/v4',
    timeout: 8000,
    httpsAgent: new https.Agent({ keepAlive: true }),
    family: 4,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json'
    }
});

async function getOrSaveRandomCharacter() {
    // Generamos un ID aleatorio entre 1 y 30000 (personajes populares y conocidos de anime)
    // Esto evita por completo el endpoint pesado de /random/characters y responde al instante.
    const randomId = Math.floor(Math.random() * 25000) + 1;

    try {
        const response = await jikanApi.get(`/characters/${randomId}`);
        const char = response.data.data;
        
        const malId = char.mal_id;
        const name = char.name;
        const image = char.images.jpg.image_url;
        const anime = char.anime[0]?.anime?.name || "Original / Desconocido";

        return new Promise((resolve, reject) => {
            db.get(`SELECT * FROM gacha_characters WHERE mal_id = ?`, [malId], (err, row) => {
                if (err) return reject(err);
                
                if (row) {
                    resolve(row);
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
        // Si por casualidad ese ID aleatorio no existe (404), intentamos recursivamente con otro al instante o usamos el respaldo local
        console.warn(`⚠️ ID ${randomId} no encontrado o falló la red, reintentando...`);
        
        // Plan B inmediato: si falla, tiramos de la base de datos local para que JAMÁS se quede colgado
        return new Promise((resolve, reject) => {
            db.get(`SELECT * FROM gacha_characters ORDER BY RANDOM() LIMIT 1`, (err, fallbackRow) => {
                if (err || !fallbackRow) {
                    return reject(new Error('No se pudo conectar a Jikan en este intento y la BD local está vacía. Vuelve a tirar.'));
                }
                resolve(fallbackRow);
            });
        });
    }
}

module.exports = {
    name: 'roll',
    aliases: ['rw', 'rollwaifu', 'waifu'],
    category: 'gacha',
    description: 'Tira un personaje de Jikan de forma instantánea mediante ID directo.',

    async execute(sock, m, args) {
        if (m.isProcessed) return;
        m.isProcessed = true;

        const jid = m.key.remoteJid;

        try {
            // Ya no ponemos el mensaje de "Buscando..." para que la respuesta se sienta inmediata y de golpe
            const character = await getOrSaveRandomCharacter();

            await sock.sendMessage(jid, {
                image: { url: character.image },
                caption: `「✿」 **¡HAS OBTENIDO UN PERSONAJE!** 🌸\n\n` +
                         `• **Nombre:** ${character.name}\n` +
                         `• **Anime:** ${character.anime}\n\n` +
                         `💡 Usa tu comando de claim para reclamarlo a tu harem.`
            }, { quoted: m });

        } catch (error) {
            console.error('Error en el comando roll:', error.message);
            await sock.sendMessage(jid, { text: `「✿」 Error: ${error.message}` }, { quoted: m });
        }
    }
};
