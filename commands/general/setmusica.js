const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'setmusica',
    aliases: ['setcancion', 'setmusic'],
    category: 'profile',
    description: 'Establecer tu música o canción favorita en el perfil.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const music = args.join(' ');

        if (!music) {
            return await sock.sendMessage(jid, { 
                text: '「✿」 MÚSICA FAVORITA 🌸\n\n⚠️ Escribe el nombre de la canción o artista.\n*Uso:* `!setmusica <canción o artista>`' 
            }, { quoted: m });
        }

        // db.updateUser(sender, { music });
        await sock.sendMessage(jid, { 
            text: `「✿」 MÚSICA ACTUALIZADA 🌸\n\n🎵 Tu canción o artista favorito ahora es: *${music}*.` 
        }, { quoted: m });
    }
};
