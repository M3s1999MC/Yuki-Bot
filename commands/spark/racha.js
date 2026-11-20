const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

db.run(`
    CREATE TABLE IF NOT EXISTS spark_streaks (
        jid TEXT PRIMARY KEY,
        streak_count INTEGER NOT NULL DEFAULT 0,
        last_claim_day TEXT
    )
`);

function getDayKey() {
    return new Date().toISOString().slice(0, 10);
}

function getYesterdayKey() {
    return new Date(Date.now() - 86400000).toISOString().slice(0, 10);
}

function getRankByStreak(days) {
    if (days >= 30) return 'Chispa Legendaria 🌟';
    if (days >= 14) return 'Motor Imparable 🔥';
    if (days >= 7) return 'Frecuencia Constante ⚡';
    if (days >= 3) return 'Calentando Motores ✨';
    return 'Primera Chispa 🌱';
}

module.exports = {
    name: 'racha',
    aliases: ['streak'],
    category: 'fun',
    description: 'Reclama y consulta tu racha diaria en Yuki.',

    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const today = getDayKey();
        const yesterday = getYesterdayKey();

        db.get(`SELECT jid, streak_count, last_claim_day FROM spark_streaks WHERE jid = ?`, [sender], async (err, row) => {
            if (err) {
                console.error('❌ Error al consultar racha:', err.message);
                return await sock.sendMessage(jid, { text: '₊˚ˑ༄ [!] Error al consultar tu racha.' }, { quoted: m });
            }

            let streak = 1;
            let note = '¡Iniciaste tu racha de hoy!';

            if (row) {
                if (row.last_claim_day === today) {
                    streak = row.streak_count;
                    note = 'Ya reclamaste tu racha de hoy. ¡Vuelve mañana!';
                } else if (row.last_claim_day === yesterday) {
                    streak = row.streak_count + 1;
                    note = '¡Racha mantenida con éxito!';
                } else {
                    streak = 1;
                    note = 'Se había enfriado la racha, pero arrancaste desde 1.';
                }

                db.run(`UPDATE spark_streaks SET streak_count = ?, last_claim_day = ? WHERE jid = ?`, [streak, today, sender]);
            } else {
                db.run(`INSERT INTO spark_streaks (jid, streak_count, last_claim_day) VALUES (?, ?, ?)`, [sender, streak, today]);
            }

            const text = [
                '₊˚ˑ༄ 𝖄𝖚𝖐𝖎 ꔛ *Racha Diaria* 🔥',
                `❀ *Días seguidos:* *${streak}*`,
                `❀ *Rango:* _${getRankByStreak(streak)}_`,
                `❀ ${note}`
            ].join('\n');

            await sock.sendMessage(jid, { text }, { quoted: m });
        });
    }
};
