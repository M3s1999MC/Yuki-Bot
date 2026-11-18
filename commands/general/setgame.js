const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'setgame',
    aliases: ['setjuego'],
    category: 'profile',
    description: 'Establecer tu juego favorito en el perfil.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const game = args.join(' ').trim();

        if (!game) {
            return await sock.sendMessage(jid, { 
                text: `₊˚ˑ༄ [✿] Debes escribir el nombre de tu juego favorito.\n❀ Uso: \`!setgame <nombre>\` 🥀` 
            }, { quoted: m });
        }

        db.run(`UPDATE users SET game = ? WHERE jid = ?`, [game, sender], async (err) => {
            if (err) {
                console.error('Error al actualizar juego favorito:', err.message);
                return await sock.sendMessage(jid, { 
                    text: `₊˚ˑ༄ [!] Error crítico al guardar tu juego favorito en la base de datos.` 
                }, { quoted: m });
            }

            await sock.sendMessage(jid, { 
                text: `₊˚ˑ༄ 𝖄𝖚𝖐𝖎 ꔛ ¡Juego favorito actualizado con éxito!\n❀ ❟ *Nuevo juego:* _${game}_ 🎮` 
            }, { quoted: m });
        });
    }
};
