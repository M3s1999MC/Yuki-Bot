const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'afk',
    aliases: ['ausente'],
    category: 'general',
    description: 'Activa o desactiva el modo ausente.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const reason = args.join(' ').trim();
        db.getSafeUser(sender, (err, user) => {
            if (err) {
                console.error('Error al registrar usuario para AFK:', err.message);
                return sock.sendMessage(jid, { text: '「✿」 No pude consultar tu estado.' }, { quoted: m });
            }

            if (!reason && user.afk_since) {
                return db.run(`UPDATE users SET afk_reason = NULL, afk_since = NULL WHERE jid = ?`, [sender], (updateErr) => {
                    if (updateErr) {
                        console.error('Error al desactivar AFK:', updateErr.message);
                        return sock.sendMessage(jid, { text: '「✿」 No se pudo desactivar el modo ausente.' }, { quoted: m });
                    }
                    sock.sendMessage(jid, { text: '「✿」 Ya estás de vuelta. 🌸' }, { quoted: m });
                });
            }

            db.run(`UPDATE users SET afk_reason = ?, afk_since = ? WHERE jid = ?`,
                [reason || 'Sin motivo especificado', Date.now(), sender], (updateErr) => {
                    if (updateErr) {
                        console.error('Error al activar AFK:', updateErr.message);
                        return sock.sendMessage(jid, { text: '「✿」 No se pudo activar el modo ausente.' }, { quoted: m });
                    }
                    const message = reason
                        ? `「✿」 Modo ausente activado. 💤\nMotivo: _${reason}_`
                        : '「✿」 Modo ausente activado. Escribe !afk al volver para desactivarlo. 💤';
                    sock.sendMessage(jid, { text: message }, { quoted: m });
                });
        });
    }
};
