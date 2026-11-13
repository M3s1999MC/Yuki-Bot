const axios = require('axios');
const https = require('https');
const db = require('../../database/db');

// Instancia optimizada para engañar al firewall de Cloudflare que protege Jikan
const jikanApi = axios.create({
    baseURL: 'https://api.jikan.moe/v4',
    timeout: 15000,
    httpsAgent: new https.Agent({ keepAlive: true }),
    family: 4, // Fuerza IPv4 para evitar bloqueos de red en Render
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
    }
});

async function getOrSaveRandomCharacter() {
    try {
        const response = await jikanApi.get('/random/characters');
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
        console.error('Error directo en Jikan API:', error.message);
        throw new Error(`Fallo en Jikan: ${error.message}`);
    }
}

module.exports = {
    name: 'roll',
    aliases: ['rw', 'rollwaifu', 'waifu'],
    category: 'gacha',
    description: 'Tira un personaje aleatorio directamente de la API de Jikan.',

    async execute(sock, m, args) {
        if (m.isProcessed) return;
        m.isProcessed = true;

        const jid = m.key.remoteJid;

        try {
            await sock.sendMessage(jid, { text: '☕ Buscando personaje en el multiverso del anime... 🌸' }, { quoted: m });

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
            await sock.sendMessage(jid, { text: `「✿」 Error técnico: ${error.message}` }, { quoted: m });
        }
    }
};
