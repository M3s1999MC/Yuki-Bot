const db = require('../../database/db');

module.exports = {
    name: 'level',
    aliases: ['lvl'],
    category: 'utility',
    description: 'Muestra tu nivel y experiencia actual.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = jid.endsWith('@g.us') ? (m.key.participant || m.key.remoteJid) : jid;
        const username = sender.split('@')[0];

        db.get(`SELECT exp, level FROM users WHERE jid = ?`, [sender], async (err, row) => {
            const exp = row ? row.exp : 0;
            const level = row ? row.level : 1;
            const nextLevelExp = level * 500;

            const caption = `「✿」 Nivel de @${username}\n\n` +
                            `📈 Nivel actual: *${level}*\n` +
                            `✨ Experiencia: *${exp} / ${nextLevelExp} XP*`;

            await sock.sendMessage(jid, { text: caption, mentions: [sender] }, { quoted: m });
        });
    }
};