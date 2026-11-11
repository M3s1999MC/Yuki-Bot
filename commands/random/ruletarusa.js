const { reply, pickOne, mentionTag, senderJid } = require('../../utils/commandHelpers');

// Castigos ficticios e inofensivos.
const punishments = [
    'Debes mandar un sticker de gato en el próximo minuto. 🐱',
    'Te toca contar un chiste al grupo (prueba con !chiste). 😂',
    'Invita un café virtual a quien quieras (usa !taza). ☕',
    'Hoy toca saludar a todos con un "buenos días" bien animado. ☀️',
    'Debes escribir tu próximo mensaje con muchos emojis. ✨',
    'Tienes que elogiar a la última persona que escribió. 💐',
    'Elige una canción y recomiéndala al grupo. 🎵'
];

module.exports = {
    name: 'ruletarusa',
    aliases: ['shot'],
    category: 'random',
    description: 'Prueba tu suerte con un castigo ficticio e inofensivo',

    // 1 de 6 recámaras tiene la "bala" (de mentira).
    async execute(sock, m) {
        const jid = senderJid(m, sock);
        const tag = mentionTag(jid);
        const bang = Math.floor(Math.random() * 6) === 0;
        const text = bang
            ? `「✿」 🔫 ${tag} gira el tambor...\n\n💥 *¡BANG!* Todo es de mentira, pero te toca un castigo:\n${pickOne(punishments)}`
            : `「✿」 🔫 ${tag} gira el tambor...\n\n💨 *Click.* Te salvaste esta vez. 😮‍💨`;
        return reply(sock, m, text, jid ? [jid] : []);
    },
    punishments
};
