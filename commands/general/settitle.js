const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

const MAX_TITLE_LENGTH = 60;

module.exports = {
    name: 'settitle',
    aliases: ['settitulo', 'titulo', 'title'],
    category: 'profile',
    description: 'Establecer tu título en el perfil.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const title = args.join(' ').trim();

        if (!title) {
            return await sock.sendMessage(jid, {
                text: `₊˚ˑ༄ [✿] Debes escribir el título que quieres mostrar.\n❀ Uso: \`!settitle <título>\` 🥀`
            }, { quoted: m });
        }

        if (title.length > MAX_TITLE_LENGTH) {
            return await sock.sendMessage(jid, {
                text: `₊˚ˑ༄ [!] El título no puede superar los ${MAX_TITLE_LENGTH} caracteres.`
            }, { quoted: m });
        }

        db.run(`UPDATE users SET title = ? WHERE jid = ?`, [title, sender], async (err) => {
            if (err) {
                console.error('❌ Error al actualizar título:', err.message);
                return await sock.sendMessage(jid, {
                    text: `₊˚ˑ༄ [!] Error crítico al guardar tu título en la base de datos.`
                }, { quoted: m });
            }

            await sock.sendMessage(jid, {
                text: `₊˚ˑ༄ 𝖄𝖚𝖐𝖎 ꔛ ¡Título actualizado con éxito!\n❀ ❟ *Nuevo título:* _${title}_ 🏷️`
            }, { quoted: m });
        });
    }
};
