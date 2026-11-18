const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'level',
    aliases: ['lvl'],
    category: 'utility',
    description: 'Muestra tu nivel y experiencia actual.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sender);
        const username = sender.split('@')[0];

        db.get(`SELECT exp, level FROM users WHERE jid = ?`, [sender], async (err, row) => {
            if (err) {
                console.error('Error al consultar nivel:', err.message);
                return await sock.sendMessage(jid, { 
                    text: '₊˚ˑ༄ [!] No pude consultar tu progreso en la base de datos 🥀' 
                }, { quoted: m });
            }

            const exp = row ? row.exp : 0;
            const level = row ? row.level : 1;
            const nextLevelExp = level * 500;

            const caption = `₊˚ˑ༄ 𝖄𝖚𝖐𝖎 // USER PROGRESS 𓍢ִ໋☕\n\n` +
                            `❀ ❟ *Usuario:* @${username}\n` +
                            `❀ ❟ *Nivel actual:* \`${level}\`\n` +
                            `❀ ❟ *Experiencia:* *${exp} / ${nextLevelExp} XP*\n\n` +
                            `° 𐐪𐑂 Sigue interactuando para subir de rango. ✿`;

            await sock.sendMessage(jid, { text: caption, mentions: [sender] }, { quoted: m });
        });
    }
};
