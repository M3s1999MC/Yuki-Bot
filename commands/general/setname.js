const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'setname',
    aliases: ['setnombreperfil'],
    category: 'profile',
    description: 'Cambiar el nombre que aparece en tu perfil.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const custom_name = args.join(' ').trim();

        if (!custom_name) {
            return await sock.sendMessage(jid, { 
                text: `₊˚ˑ༄ [✿] Debes escribir el nombre que deseas mostrar en tu perfil.\n❀ Uso: \`!setname <nombre>\` 🥀` 
            }, { quoted: m });
        }

        db.run(`UPDATE users SET custom_name = ? WHERE jid = ?`, [custom_name, sender], async (err) => {
            if (err) {
                console.error('Error al actualizar nombre de perfil:', err.message);
                return await sock.sendMessage(jid, { 
                    text: `₊˚ˑ༄ [!] Error crítico al guardar tu nombre de perfil en la base de datos.` 
                }, { quoted: m });
            }

            await sock.sendMessage(jid, { 
                text: `₊˚ˑ༄ 𝖄𝖚𝖐𝖎 ꔛ ¡Nombre de perfil actualizado con éxito!\n❀ ❟ *Nuevo alias:* _${custom_name}_ ✨` 
            }, { quoted: m });
        });
    }
};
