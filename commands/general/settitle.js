const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'settitle',
    aliases: ['settitulo'],
    category: 'profile',
    description: 'Establecer tu título en el perfil.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const title = args.join(' ').trim();

        if (!title) {
            return await sock.sendMessage(jid, { 
                text: `₊˚ˑ༄ [✿] Debes escribir el título que deseas llevar.\n❀ Uso: \`!settitle <tu título>\` 🥀` 
            }, { quoted: m });
        }

        db.run(`UPDATE users SET title = ? WHERE jid = ?`, [title, sender], async (err) => {
            if (err) {
                console.error('Error al actualizar título:', err.message);
                return await sock.sendMessage(jid, { 
                    text: `₊˚ˑ༄ [!] La columna 'title' no existe en la base de datos o hubo un error al guardar.` 
                }, { quoted: m });
            }

            await sock.sendMessage(jid, { 
                text: `₊˚ˑ༄ 𝖄𝖚𝖐𝖎 ꔛ ¡Título actualizado con éxito!\n❀ ❟ *Nuevo título:* _${title}_ ✨` 
            }, { quoted: m });
        });
    }
};
