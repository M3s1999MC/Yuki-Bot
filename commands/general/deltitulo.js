const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'deltitle',
    aliases: ['deltitulo', 'quitartitulo', 'borrartitulo'],
    category: 'profile',
    description: 'Elimina tu título del perfil.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);

        db.run(`UPDATE users SET title = NULL WHERE jid = ?`, [sender], async (err) => {
            if (err) {
                console.error('❌ Error al eliminar título:', err.message);
                return await sock.sendMessage(jid, {
                    text: `₊˚ˑ༄ [!] Error crítico al eliminar tu título en la base de datos.`
                }, { quoted: m });
            }

            await sock.sendMessage(jid, {
                text: `₊˚ˑ༄ 𝖄𝖚𝖐𝖎 ꔛ ¡Título eliminado de tu perfil! 🏷️`
            }, { quoted: m });
        });
    }
};
