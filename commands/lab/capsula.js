const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

db.run(`
    CREATE TABLE IF NOT EXISTS time_capsules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        jid TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

module.exports = {
    name: 'capsula',
    aliases: ['timecapsule', 'guardarcapsula', 'abrircapsula'],
    category: 'fun',
    description: 'Guarda o abre una cápsula del tiempo en SQLite.',

    async execute(sock, m, args, commandName) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const sub = (args[0] || '').toLowerCase();
        const isOpen = (commandName || '').toLowerCase() === 'abrircapsula' || sub === 'abrir' || sub === 'open';

        if (isOpen) {
            const rawId = sub === 'abrir' || sub === 'open' ? args[1] : args[0];
            const id = Number.parseInt(rawId, 10);

            const sql = Number.isInteger(id)
                ? `SELECT id, message, created_at FROM time_capsules WHERE id = ? AND jid = ?`
                : `SELECT id, message, created_at FROM time_capsules WHERE jid = ? ORDER BY id DESC LIMIT 1`;
            const params = Number.isInteger(id) ? [id, sender] : [sender];

            return db.get(sql, params, async (err, row) => {
                if (err) {
                    console.error('❌ Error al abrir cápsula:', err.message);
                    return await sock.sendMessage(jid, { text: '₊˚ˑ༄ [!] Error al leer la cápsula.' }, { quoted: m });
                }
                if (!row) {
                    return await sock.sendMessage(jid, { text: '₊˚ˑ༄ [✿] No encontré ninguna cápsula tuya.' }, { quoted: m });
                }
                await sock.sendMessage(jid, {
                    text: `₊˚ˑ༄ 𝖄𝖚𝖐𝖎 ꔛ *Cápsula #${row.id}* (${row.created_at}) ⏳\n❀ _"${row.message}"_`
                }, { quoted: m });
            });
        }

        const content = args.join(' ').trim();
        if (!content) {
            return await sock.sendMessage(jid, {
                text: '₊˚ˑ༄ [✿] Uso: `!capsula <mensaje>` o `!capsula abrir`'
            }, { quoted: m });
        }

        db.run(`INSERT INTO time_capsules (jid, message) VALUES (?, ?)`, [sender, content.slice(0, 1500)], async function (err) {
            if (err) {
                console.error('❌ Error al guardar cápsula:', err.message);
                return await sock.sendMessage(jid, { text: '₊˚ˑ༄ [!] No pude sellar la cápsula.' }, { quoted: m });
            }
            await sock.sendMessage(jid, {
                text: `₊˚ˑ༄ 𝖄𝖚𝖐𝖎 ꔛ Cápsula *#${this.lastID}* sellada 🔐.`
            }, { quoted: m });
        });
    }
};
