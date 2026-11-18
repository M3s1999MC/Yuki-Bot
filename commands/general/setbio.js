const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'setbio',
    aliases: ['setbiografia'],
    category: 'profile',
    description: 'Establecer tu biografía en el perfil.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const bio = args.join(' ').trim();

        if (!bio) {
            return await sock.sendMessage(jid, { 
                text: `₊˚ˑ༄ [✿] Debes escribir el texto para tu biografía.\n❀ Uso: \`!setbio <tu texto>\` 🥀` 
            }, { quoted: m });
        }

        db.run(`UPDATE users SET bio = ? WHERE jid = ?`, [bio, sender], async (err) => {
            if (err) {
                console.error('Error al actualizar biografía:', err.message);
                return await sock.sendMessage(jid, { 
                    text: `₊˚ˑ༄ [!] Error crítico al guardar tu biografía en la base de datos.` 
                }, { quoted: m });
            }

            await sock.sendMessage(jid, { 
                text: `₊˚ˑ༄ 𝖄𝖚𝖐𝖎 ꔛ ¡Biografía actualizada con éxito!\n❀ ❟ *Nuevo estado:* _${bio}_ ✿` 
            }, { quoted: m });
        });
    }
};
