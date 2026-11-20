const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'delgame',
    aliases: ['deljuego', 'removegame', 'removejuego', 'quitargame', 'quitarjuego'],
    category: 'profile',
    description: 'Eliminar tu juego favorito del perfil.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);

        db.run(`UPDATE users SET game = NULL WHERE jid = ?`, [sender], async function (err) {
            if (err) {
                console.error('Error al eliminar juego favorito:', err.message);
                return await sock.sendMessage(jid, { 
                    text: `₊˚ˑ༄ [!] Error crítico al eliminar tu juego favorito en la base de datos.` 
                }, { quoted: m });
            }

            await sock.sendMessage(jid, { 
                text: `₊˚ˑ༄ 𝖄𝖚𝖐𝖎 ꔛ ¡Tu juego favorito ha sido eliminado de tu perfil! 🎮` 
            }, { quoted: m });
        });
    }
};
