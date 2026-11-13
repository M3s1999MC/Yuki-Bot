const axios = require('axios');
const https = https = require('https');

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

// Lista de IDs reales y seguros de MyAnimeList
const safeIds = [1, 2, 3, 4, 5, 17, 18, 20, 21, 40, 62, 71, 80, 117, 407, 73, 79, 81, 82, 89, 90, 155, 307, 469, 111, 314, 1176, 209, 300, 301, 311, 499, 1182, 1999, 2197, 7111, 10255, 13742];

module.exports = {
    name: 'roll',
    aliases: ['rw', 'rollwaifu', 'waifu'],
    category: 'gacha',
    description: 'Tira un personaje directo de Jikan al instante con reacción de espera.',

    async execute(sock, m, args) {
        if (m.isProcessed) return;
        m.isProcessed = true;

        const jid = m.key.remoteJid;

        try {
            // 1. Reacción instantánea de relojito para que se note que el bot procesa
            await sock.sendMessage(jid, {
                react: { text: '⏳', key: m.key }
            });

            // 2. Seleccionamos un ID al azar de la lista segura y consultamos Jikan
            const randomId = safeIds[Math.floor(Math.random() * safeIds.length)];
            const response = await jikanApi.get(`/characters/${randomId}`);
            const char = response.data.data;

            const character = {
                name: char.name,
                image: char.images.jpg.image_url,
                anime: char.anime[0]?.anime?.name || "Original / Desconocido"
            };

            // 3. Enviamos el resultado de golpe y quitamos/cambiamos la reacción si gustas
            await sock.sendMessage(jid, {
                image: { url: character.image },
                caption: `「✿」 **¡HAS OBTENIDO UN PERSONAJE!** 🌸\n\n` +
                         `• **Nombre:** ${character.name}\n` +
                         `• **Anime:** ${character.anime}\n\n` +
                         `💡 Usa tu comando de claim para reclamarlo a tu harem.`
            }, { quoted: m });

            // Reacción de éxito opcional
            await sock.sendMessage(jid, {
                react: { text: '🌸', key: m.key }
            });

        } catch (error) {
            console.error('Error en el comando roll:', error.message);
            await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
            await sock.sendMessage(jid, { text: `「✿」 Ups, la API de Jikan tardó en responder. Inténtalo de nuevo. 🌸` }, { quoted: m });
        }
    }
};
