const { getOrSaveRandomCharacter } = require('../../database/gacha_db');

// Dentro de execute:
const character = await getOrSaveRandomCharacter();
if (!character) {
    return await sock.sendMessage(jid, { text: '「✿」 Ups, ocurrió un error al buscar el personaje 🌸' }, { quoted: m });
}

await sock.sendMessage(jid, {
    image: { url: character.image },
    caption: `☕ **¡PERSONAJE OBTENIDO!** 🌸\n\n• **Nombre:** ${character.name}\n• **Anime:** ${character.anime}`
}, { quoted: m });
