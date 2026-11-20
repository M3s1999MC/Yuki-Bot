const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

const MAX_MUSIC_LENGTH = 100;

module.exports = {
    name: 'setmusic',
    aliases: ['setmusica', 'setcancion', 'musica', 'cancion', 'music'],
    category: 'profile',
    description: 'Establecer tu música o canción favorita en el perfil.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const musicName = args.join(' ').trim();

        if (!musicName) {
            return await sock.sendMessage(jid, {
                text: `₊˚ˑ༄ [✿] Escribe tu canción, banda o género musical favorito.\n❀ Uso: \`!setmusic El Cuarteto de Nos\` o \`!setmusic Creep\` 🥀`
            }, { quoted: m });
        }

        if (musicName.length > MAX_MUSIC_LENGTH) {
            return await sock.sendMessage(jid, {
                text: `₊˚ˑ༄ [!] El texto de música favorita no puede superar los ${MAX_MUSIC_LENGTH} caracteres.`
            }, { quoted: m });
        }

        db.run(`UPDATE users SET music = ? WHERE jid = ?`, [musicName, sender], async (err) => {
            if (err) {
                console.error('❌ Error al guardar música favorita:', err.message);
                return await sock.sendMessage(jid, {
                    text: `₊˚ˑ༄ [!] Error crítico al guardar tu música favorita en la base de datos.`
                }, { quoted: m });
            }

            await sock.sendMessage(jid, {
                text: `₊˚ˑ༄ 𝖄𝖚𝖐𝖎 ꔛ ¡Música favorita actualizada con éxito!\n❀ ❟ *Nueva música:* _${musicName}_ 🎵`
            }, { quoted: m });
        });
    }
};
