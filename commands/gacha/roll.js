const { getRandomCharacter } = require('../../utils/gachaApi');

// Dentro de tu comando execute:
const character = await getRandomCharacter();

if (!character) {
    return await sock.sendMessage(jid, { text: '「✿」 Ups, la API de Jikan tardó en responder, intenta de nuevo 🌸' }, { quoted: m });
}

// Envías la tirada con la imagen que trae la API automáticamente
await sock.sendMessage(jid, {
    image: { url: character.image },
    caption: `「✿」 **¡HAS OBTENIDO UN PERSONAJE!** 🌸\n\n` +
             `• **Nombre:** ${character.name}\n` +
             `• **Serie:** ${character.anime}\n\n` +
             `💡 Usa *!claim* para reclamarlo a tu harem.`
}, { quoted: m });
