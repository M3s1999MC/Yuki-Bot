// listwarn.js
const db = require('../../database/db');
module.exports = {
    name: 'listwarn',
    aliases: ['warnings', 'advertencias'],
    category: 'group',
    description: 'Muestra las advertencias de un usuario.',
    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        if (!jid.endsWith('@g.us')) return;

        let target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.participant || (m.key.participant || m.key.remoteJid);

        db.all(`SELECT reason FROM warnings WHERE group_jid = ? AND user_jid = ? ORDER BY id`, [jid, target], async (err, rows) => {
            if (err) {
                console.error('Error al consultar advertencias:', err.message);
                return sock.sendMessage(jid, { text: '「✿」 No se pudieron consultar las advertencias.' }, { quoted: m });
            }
            if (!rows.length) return await sock.sendMessage(jid, { text: `「✿」 @${target.split('@')[0]} no tiene advertencias. 🌸`, mentions: [target] }, { quoted: m });

            let text = `「✿」 Advertencias de @${target.split('@')[0]} (*${rows.length}*) ⚠️\n\n`;
            rows.forEach((w, i) => {
                text += `${i + 1}. Motivo: ${w.reason}\n`;
            });
            await sock.sendMessage(jid, { text, mentions: [target] }, { quoted: m });
        });
    }
};