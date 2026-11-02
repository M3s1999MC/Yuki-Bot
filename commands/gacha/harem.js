const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'harem',
    aliases: ['waifus', 'claims'],
    category: 'gacha',
    description: 'Muestra los personajes reclamados por un usuario.',

    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const context = m.message?.extendedTextMessage?.contextInfo;
        const sender = getMessageSenderJid(m, sock);
        const target = context?.mentionedJid?.[0] || sender;

        db.all(
            `SELECT character_name, series, value FROM harem WHERE owner_jid = ? ORDER BY value DESC, character_name COLLATE NOCASE`,
            [target],
            (err, characters) => {
                if (err) {
                    console.error('Error al consultar el harem:', err.message);
                    return sock.sendMessage(jid, { text: '「✿」 No pude consultar el harem.' }, { quoted: m });
                }

                const totalValue = characters.reduce((total, character) => total + (Number(character.value) || 0), 0);
                const list = characters.length
                    ? characters.slice(0, 30).map((character, i) =>
                        `${i + 1}. *${character.character_name}* — ${character.series} · 💎 ${Number(character.value || 0).toLocaleString('es-CO')}`
                    ).join('\n')
                    : '_Todavía no tiene personajes. Usa !roll para empezar._';

                sock.sendMessage(jid, {
                    text: `「✿」 Harem de @${target.split('@')[0]} 🌸\n\n${list}\n\n📦 Personajes: *${characters.length}* · 💎 Valor: *${totalValue.toLocaleString('es-CO')}*`,
                    mentions: [target]
                }, { quoted: m });
            }
        );
    }
};
