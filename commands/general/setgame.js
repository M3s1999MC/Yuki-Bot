const { updateProfileField } = require('../../database/db');

const MAX_GAME_LENGTH = 100;

module.exports = {
    name: 'setgame',
    aliases: ['setjuego', 'juego', 'game', 'juegofav', 'gamefav'],
    category: 'profile',
    description: 'Establecer tu juego favorito en el perfil.',

    async execute(message, args) {
        const game = args.join(' ').trim();

        if (!game) {
            return await message.reply(
                '₊˚ˑ༄ [✿] Debes escribir el nombre de tu juego favorito.\n❀ Uso: `!setgame <nombre>` 🥀'
            );
        }

        if (game.length > MAX_GAME_LENGTH) {
            return await message.reply(
                `₊˚ˑ༄ [!] El nombre del juego no puede superar los ${MAX_GAME_LENGTH} caracteres.`
            );
        }

        try {
            await updateProfileField(message.author.id, 'favorite_game', game);

            await message.reply(
                `₊˚ˑ༄ 𝖄𝖚𝖐𝖎 ꔛ ¡Juego favorito actualizado con éxito!\n❀ ❟ *Nuevo juego:* _${game}_ 🎮`
            );
        } catch (err) {
            console.error('❌ Error al actualizar juego favorito:', err);
            await message.reply(
                '₊˚ˑ༄ [!] Error crítico al guardar tu juego favorito en la base de datos.'
            );
        }
    }
};
