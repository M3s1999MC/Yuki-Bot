const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'deletewaifu',
    aliases: ['delchar', 'delwaifu'],
    category: 'gacha',
    description: 'Elimina un personaje reclamado de tu harem.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const query = args.join(' ').trim();
        if (!query) {
            return sock.sendMessage(jid, { text: '「✿」 Indica el nombre del personaje que quieres eliminar.' }, { quoted: m });
        }

        db.run(
            `DELETE FROM harem WHERE id = (
                SELECT id FROM harem WHERE owner_jid = ? AND character_name LIKE ? COLLATE NOCASE LIMIT 1
            )`,
            [sender, `%${query}%`],
            function(err) {
                if (err) {
                    console.error('Error al eliminar personaje del harem:', err.message);
                    return sock.sendMessage(jid, { text: '「✿」 No se pudo eliminar el personaje.' }, { quoted: m });
                }
                const text = this.changes
                    ? `「✿」 Se eliminó *${query}* de tu harem. 🗑️`
                    : '「✿」 No encontré ese personaje en tu harem.';
                sock.sendMessage(jid, { text }, { quoted: m });
            }
        );
    }
};
