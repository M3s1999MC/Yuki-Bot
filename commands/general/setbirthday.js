const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'setbirthday',
    aliases: ['setbirth', 'setcumple'],
    category: 'profile',
    description: 'Establecer tu fecha de cumpleaños en el perfil.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const birthday = args[0]?.trim();

        if (!birthday) {
            return await sock.sendMessage(jid, { 
                text: `₊˚ˑ༄ [✿] Debes indicar tu fecha de cumpleaños en formato DD/MM/AAAA.\n❀ Uso: \`!setbirthday 25/12/2001\` 🥀` 
            }, { quoted: m });
        }

        db.run(`UPDATE users SET birthday = ? WHERE jid = ?`, [birthday, sender], async (err) => {
            if (err) {
                console.error('Error al actualizar cumpleaños:', err.message);
                return await sock.sendMessage(jid, { 
                    text: `₊˚ˑ༄ [!] Error crítico al guardar tu cumpleaños en la base de datos.` 
                }, { quoted: m });
            }

            await sock.sendMessage(jid, { 
                text: `₊˚ˑ༄ 𝖄𝖚𝖐𝖎 ꔛ ¡Cumpleaños registrado con éxito!\n❀ ❟ *Fecha establecida:* _${birthday}_ 🎂` 
            }, { quoted: m });
        });
    }
};
