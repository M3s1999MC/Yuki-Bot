const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'titulo',
    aliases: ['settitle', 'tituloperfil'],
    description: 'Establece un título personalizado en tu perfil',
    async execute(sock, m, args) {
        const jid = getMessageSenderJid(m, sock);
        const titulo = args.join(' ');
        if (!titulo) return sock.sendMessage(m.key.remoteJid, { text: '⚠️ Escribe el título que quieres ponértelo. Ejemplo: `!titulo El Animador Legendario`' }, { quoted: m });

        db.run(`UPDATE users SET bio = ? WHERE jid = ?`, [titulo, jid], async (err) => {
            if (err) return sock.sendMessage(m.key.remoteJid, { text: '❌ Error al guardar el título.' }, { quoted: m });
            await sock.sendMessage(m.key.remoteJid, { text: `🏷️ ¡Título actualizado! Ahora eres: *${titulo}*` }, { quoted: m });
        });
    }
};
