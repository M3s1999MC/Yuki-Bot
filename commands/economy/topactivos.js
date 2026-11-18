const db = require('../../database/db');

module.exports = {
    name: 'topactivos',
    aliases: ['topmensajessemana', 'topactividad', 'activos'],
    category: 'economy',
    description: 'Muestra el top 10 de los miembros más activos y participativos del grupo.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;

        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { 
                text: '「✿」 COMANDO EXCLUSIVO DE GRUPOS 🥀\n\n₊˚ˑ༄ Este ranking de actividad solo puede consultarse dentro de grupos de la red.' 
            }, { quoted: m });
        }

        db.all(
            `SELECT user_jid, count FROM message_counts WHERE group_jid = ? ORDER BY count DESC LIMIT 10`,
            [jid],
            async (err, rows) => {
                if (err || !rows || rows.length === 0) {
                    return sock.sendMessage(jid, { 
                        text: '「✿」 SIN REGISTROS DE ACTIVIDAD 🥀\n\n₊˚ˑ༄ Aún no hay datos de mensajes contabilizados en este grupo del ciberespacio.' 
                    }, { quoted: m });
                }

                let texto = `「✿」 TOP 10 MIEMBROS MÁS ACTIVOS 🏆✨\n\n` +
                            `₊˚ˑ༄ Usuarios con mayor participación en el chat:\n\n`;
                
                const mentions = [];
                rows.forEach((row, idx) => {
                    const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `\`#${idx + 1}\``;
                    const countFormatted = Number(row.count || 0).toLocaleString('es-CO');

                    texto += `${medal} @${row.user_jid.split('@')[0]} — *${countFormatted}* mensajes\n`;
                    mentions.push(row.user_jid);
                });

                texto += `\n───────────────────\n` +
                         `❀ _¡Sigue participando para escalar posiciones en la red de Yuki!_ 🌸`;

                await sock.sendMessage(jid, { text: texto, mentions }, { quoted: m });
            }
        );
    }
};
