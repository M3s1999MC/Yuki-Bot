const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'givechar',
    aliases: ['givewaifu', 'regalar'],
    category: 'gacha',
    description: 'Regala un personaje reclamado a otra persona.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const context = m.message?.extendedTextMessage?.contextInfo;
        const target = context?.mentionedJid?.[0] || context?.participant;
        const query = args.filter(arg => !/^@\d+$/.test(arg)).join(' ').trim();

        if (!target) {
            return sock.sendMessage(jid, { text: '「✿」 Menciona o responde al usuario que recibirá el personaje.' }, { quoted: m });
        }
        if (target === sender) {
            return sock.sendMessage(jid, { text: '「✿」 No puedes regalarte un personaje a ti mismo.' }, { quoted: m });
        }
        if (!query) {
            return sock.sendMessage(jid, { text: '「✿」 Indica el nombre del personaje que quieres regalar.' }, { quoted: m });
        }

        db.getSafeUser(target, (ensureErr) => {
            if (ensureErr) {
                console.error('Error al registrar destinatario del personaje:', ensureErr.message);
                return sock.sendMessage(jid, { text: '「✿」 No pude preparar la cuenta del destinatario.' }, { quoted: m });
            }
            db.get(`SELECT id, character_name FROM harem WHERE owner_jid = ? AND character_name LIKE ? COLLATE NOCASE LIMIT 1`, [sender, `%${query}%`], (findErr, character) => {
                if (findErr || !character) {
                    if (findErr) console.error('Error al buscar personaje para regalar:', findErr.message);
                    return sock.sendMessage(jid, { text: '「✿」 No encontré ese personaje en tu harem.' }, { quoted: m });
                }
                db.run(`UPDATE harem SET owner_jid = ? WHERE id = ? AND owner_jid = ?`, [target, character.id, sender], function(updateErr) {
                    if (updateErr || !this.changes) {
                        if (updateErr) console.error('Error al transferir personaje:', updateErr.message);
                        return sock.sendMessage(jid, { text: '「✿」 No se pudo transferir el personaje.' }, { quoted: m });
                    }
                    sock.sendMessage(jid, {
                        text: `「✿」 Regalaste *${character.character_name}* a @${target.split('@')[0]}. 🎁`,
                        mentions: [sender, target]
                    }, { quoted: m });
                });
            });
        });
    }
};
