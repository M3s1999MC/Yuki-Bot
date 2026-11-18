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
        const music = args.join(' ').trim();

        if (!music) {
            return await sock.sendMessage(jid, { 
                text: `₊˚ˑ༄ [✿] Debes escribir el nombre de tu canción o artista favorito.\n❀ Uso: \`!setmusica <canción o artista>\` 🥀` 
            }, { quoted: m });
        }

        db.run(`UPDATE users SET music = ? WHERE jid = ?`, [music, sender], async (err) => {
            if (err) {
                console.error('Error al actualizar música favorita:', err.message);
                return await sock.sendMessage(jid, { 
                    text: `₊˚ˑ༄ [!] Error crítico al guardar tu música favorita en la base de datos.` 
                }, { quoted: m });
            }

            await sock.sendMessage(jid, { 
                text: `₊˚ˑ༄ 𝖄𝖚𝖐𝖎 ꔛ ¡Música favorita actualizada con éxito!\n❀ ❟ *Nuevo artista/canción:* _${music}_ 🎵` 
            }, { quoted: m });
        });
    }
};
