const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'delmusic',
    aliases: ['delmusica', 'delcancion', 'borrarmusica', 'quitarmusica', 'borrarcancion'],
    category: 'profile',
    description: 'Elimina tu música o canción favorita del perfil.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);

        db.run(`UPDATE users SET music = NULL WHERE jid = ?`, [sender], async (err) => {
            if (err) {
                console.error('❌ Error al borrar música favorita:', err.message);
                return await sock.sendMessage(jid, {
                    text: `₊˚ˑ༄ [!] Error crítico al eliminar tu música favorita en la base de datos.`
                }, { quoted: m });
            }

            await sock.sendMessage(jid, {
                text: `₊˚ˑ༄ 𝖄𝖚𝖐𝖎 ꔛ ¡Música favorita eliminada con éxito!\n❀ ❟ *Música:* _Sin asignar_ 🎵`
            }, { quoted: m });
        });
    }
};
