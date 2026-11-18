const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'unmute',
    aliases: ['desilenciar', 'unban'],
    category: 'economy',
    description: 'Devuelve los permisos de interacción y uso de comandos a un usuario silenciado en la red.',

    async execute(sock, m, args, usedPrefix = '!') {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);

        // Verificar si el remitente es administrador del grupo (si aplica)
        if (jid.endsWith('@g.us')) {
            try {
                const groupMetadata = await sock.groupMetadata(jid);
                const participants = groupMetadata.participants || [];
                const senderParticipant = participants.find(p => p.id === sender);
                const isSenderAdmin = senderParticipant && (senderParticipant.admin === 'admin' || senderParticipant.admin === 'superadmin');
                const botParticipant = participants.find(p => p.id === sock.user.id || p.id?.includes(sock.user.id.split(':')[0]));
                const isBotAdmin = botParticipant && (botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin');

                if (!isSenderAdmin) {
                    return sock.sendMessage(jid, { 
                        text: '「✿」 ACCESO DENEGADO 🥀\n\n₊˚ˑ༄ Solo los administradores del grupo pueden desilenciar usuarios en la red.' 
                    }, { quoted: m });
                }

                if (!isBotAdmin) {
                    return sock.sendMessage(jid, { 
                        text: '「✿」 PERMISOS INSUFICIENTES 🥀\n\n₊˚ˑ༄ Yuki necesita ser administradora del grupo para gestionar restricciones.' 
                    }, { quoted: m });
                }
            } catch (err) {
                console.error('Error al verificar metadatos de grupo en unmute:', err.message);
            }
        }

        const context = m.message?.extendedTextMessage?.contextInfo;
        const targetRaw = context?.mentionedJid?.[0] || args[0];

        if (!targetRaw) {
            return sock.sendMessage(jid, { 
                text: `「✿」 DESILENCIAR USUARIO 🔊✨\n\n` +
                      `₊˚ˑ༄ Restablece los permisos de un miembro en el chat:\n` +
                      `❀ *Uso:* \`${usedPrefix}unmute @usuario\` 🌸` 
            }, { quoted: m });
        }

        const target = targetRaw.includes('@') ? targetRaw : `${targetRaw.replace(/[^0-9]/g, '')}@s.whatsapp.net`;

        // Asegurar tabla de silenciamientos si existe en la base de datos
        db.run(`CREATE TABLE IF NOT EXISTS mutes (
            chat_jid TEXT,
            user_jid TEXT,
            PRIMARY KEY (chat_jid, user_jid)
        )`, () => {});

        db.run(`DELETE FROM mutes WHERE chat_jid = ? AND user_jid = ?`, [jid, target], function(err) {
            if (err) {
                console.error('Error al desilenciar usuario:', err.message);
                return sock.sendMessage(jid, { text: '「✿」 ERROR DE RED // No pude remover el estado de silencio. 🥀' }, { quoted: m });
            }

            const text = `「✿」 USUARIO DESILENCIADO 🔊✨\n\n` +
                         `₊˚ˑ༄ Se han restaurado los privilegios de interacción en la red.\n` +
                         `❀ 👤 *Usuario:* @${target.split('@')[0]}\n` +
                         `───────────────────\n` +
                         `❀ _¡Ya puedes volver a usar los comandos de Yuki con normalidad!_ 🌸`;

            sock.sendMessage(jid, { text, mentions: [target] }, { quoted: m });
        });
    }
};
