const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'intereses',
    aliases: ['gustos'],
    category: 'general',
    description: 'Establece una lista de gustos o intereses en tu perfil',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const texto = args.join(' ').trim();

        if (!texto) {
            return sock.sendMessage(jid, { 
                text: `₊˚ˑ༄ [✿] Debes especificar tus intereses.\n❀ Ejemplo: \`!intereses Anime, Voleibol, Programar\` 🥀` 
            }, { quoted: m });
        }

        db.run(`UPDATE users SET hobby = ? WHERE jid = ?`, [texto, sender], async (err) => {
            if (err) {
                console.error('Error al actualizar intereses:', err.message);
                return sock.sendMessage(jid, { 
                    text: `₊˚ˑ༄ [!] Error crítico al actualizar tus intereses en la base de datos.` 
                }, { quoted: m });
            }

            await sock.sendMessage(jid, { 
                text: `₊˚ˑ༄ 𝖄𝖚𝖐𝖎 ꔛ ¡Intereses actualizados con éxito!\n❀ ❟ *Nuevos gustos:* _${texto}_ ✿` 
            }, { quoted: m });
        });
    }
};
