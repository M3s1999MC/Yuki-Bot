const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'giveallharem',
    category: 'gacha',
    description: 'Regala todos tus personajes reclamados a otro usuario.',

    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
            m.message?.extendedTextMessage?.contextInfo?.participant;
        if (!target) {
            return sock.sendMessage(jid, { text: '「✿」 Menciona o responde al usuario que recibirá tu harem.' }, { quoted: m });
        }
        if (target === sender) {
            return sock.sendMessage(jid, { text: '「✿」 No puedes regalarte tu propio harem.' }, { quoted: m });
        }

        db.getSafeUser(target, (ensureErr) => {
            if (ensureErr) {
                console.error('Error al registrar destinatario del harem:', ensureErr.message);
                return sock.sendMessage(jid, { text: '「✿」 No pude preparar la cuenta del destinatario.' }, { quoted: m });
            }
            db.run(`UPDATE harem SET owner_jid = ? WHERE owner_jid = ?`, [target, sender], function(err) {
                if (err) {
                    console.error('Error al transferir harem completo:', err.message);
                    return sock.sendMessage(jid, { text: '「✿」 No se pudo transferir tu harem.' }, { quoted: m });
                }
                if (!this.changes) {
                    return sock.sendMessage(jid, { text: '「✿」 No tienes personajes para regalar.' }, { quoted: m });
                }
                sock.sendMessage(jid, {
                    text: `「✿」 @${sender.split('@')[0]} regaló *${this.changes}* personaje(s) a @${target.split('@')[0]}. 🎁`,
                    mentions: [sender, target]
                }, { quoted: m });
            });
        });
    }
};
