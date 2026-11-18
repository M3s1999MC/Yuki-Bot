const db = require('../../database/db');
const { reply, senderJid, targetJid, mentionTag } = require('../../utils/commandHelpers');

module.exports = {
    name: 'mute',
    aliases: ['silenciar'],
    category: 'moderation',
    description: 'Silencia a un usuario para evitar que use comandos en el chat de Yuki.',

    async execute(sock, m, args) {
        try {
            const jid = m.key.remoteJid;
            const sender = senderJid(m, sock);
            const target = targetJid(m);

            if (!target) {
                return reply(sock, m, 
                    `「✿」 COMANDO DE MODERACIÓN 🤫\n\n` +
                    `₊˚ˑ༄ Indica qué usuario no podrá interactuar con el bot.\n` +
                    `❀ *Uso:* \`!mute @usuario\` 🌸`, 
                    []
                );
            }

            // Opcional: Verificar si la tabla de baneados/silenciados existe o manejarlo en SQLite
            db.run(
                `INSERT INTO muted_users (jid, chat_id, muted_by) VALUES (?, ?, ?)
                 ON CONFLICT(jid, chat_id) DO NOTHING`,
                [target, jid, sender],
                (err) => {
                    if (err) {
                        // Si la tabla no existe o hay error, aseguramos un respaldo lógico o creamos la tabla
                        db.run(`CREATE TABLE IF NOT EXISTS muted_users (jid TEXT, chat_id TEXT, muted_by TEXT, PRIMARY KEY(jid, chat_id))`, () => {
                            db.run(`INSERT OR IGNORE INTO muted_users (jid, chat_id, muted_by) VALUES (?, ?, ?)`, [target, jid, sender]);
                        });
                    }
                }
            );

            const text = `「✿」 USUARIO SILENCIADO 🤫✨\n\n` +
                         `₊˚ˑ༄ El usuario ${mentionTag(target)} ha sido privado de privilegios sobre los comandos de Yuki.\n` +
                         `───────────────────\n` +
                         `❀ _Acción ejecutada por moderación de la red_ 🌸`;

            return reply(sock, m, text, [target]);

        } catch (error) {
            console.error('Error en !mute:', error.message);
            return reply(sock, m, '「✿」 ERROR DE RED // No pude silenciar al usuario solicitado. 🥀');
        }
    }
};
