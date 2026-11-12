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
        const game = args.join(' ');

        if (!game) {
            return await sock.sendMessage(jid, { 
                text: '「✿」 JUEGO FAVORITO 🌸\n\n⚠️ Escribe el nombre de tu juego.\n*Uso:* `!setgame <nombre>`' 
            }, { quoted: m });
        }

        // db.updateUser(sender, { game });
        await sock.sendMessage(jid, { 
            text: `「✿」 JUEGO ACTUALIZADO 🌸\n\n🎮 Tu juego favorito ahora es: *${game}*.` 
        }, { quoted: m });
    }
};
