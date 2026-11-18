const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

function formatTime(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));

    let timeString = '';
    if (hours > 0) timeString += `${hours}h `;
    if (minutes > 0 || hours > 0) timeString += `${minutes}m `;
    timeString += `${seconds}s`;
    return timeString.trim();
}

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
                return sock.sendMessage(jid, { text: '₊˚ˑ༄ [!] No pude consultar tu estado en la red 🥀' }, { quoted: m });
            }

            // Si ya estaba en AFK y vuelve a usar el comando, lo desactivamos y calculamos el tiempo
            if (user && user.afk_since) {
                const tiempoAusente = Date.now() - user.afk_since;
                const tiempoLegible = formatTime(tiempoAusente);

                return db.run(`UPDATE users SET afk_reason = NULL, afk_since = NULL WHERE jid = ?`, [sender], (updateErr) => {
                    if (updateErr) {
                        console.error('Error al desactivar AFK:', updateErr.message);
                        return sock.sendMessage(jid, { text: '₊˚ˑ༄ [!] No se pudo desactivar el modo ausente 🪞' }, { quoted: m });
                    }
                    return sock.sendMessage(jid, { 
                        text: `₊˚ˑ༄ 𝖄𝖚𝖐𝖎 ꔛ ¡Bienvenido de nuevo! Has estado ausente por *${tiempoLegible}*. ❀` 
                    }, { quoted: m });
                });
            }

            // Si no estaba en AFK, lo activamos
            const afkReason = reason || 'Sin motivo especificado';
            const timestamp = Date.now();

            db.run(`UPDATE users SET afk_reason = ?, afk_since = ? WHERE jid = ?`,
                [afkReason, timestamp, sender], (updateErr) => {
                    if (updateErr) {
                        console.error('Error al activar AFK:', updateErr.message);
                        return sock.sendMessage(jid, { text: '₊˚ˑ༄ [!] No se pudo activar el modo ausente.' }, { quoted: m });
                    }

                    const mensajeAfk = reason
                        ? `₊˚ˑ༄ 𝖄𝖚𝖐𝖎 ꔛ Modo ausente activado. 💤\n❀ ❟ *Motivo:* _${reason}_`
                        : `₊˚ˑ༄ 𝖄𝖚𝖐𝖎 ꔛ Modo ausente activado. Escribe \`!afk\` al volver para desactivarlo. 💤`;

                    sock.sendMessage(jid, { text: mensajeAfk }, { quoted: m });
                });
        });
    }
};
