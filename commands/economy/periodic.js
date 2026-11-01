const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'periodic_legacy',
    aliases: [],
    category: 'economia',
    description: 'Reclama tu recompensa económica semanal o mensual.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const ahora = Date.now();

        const body = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const commandUsed = body.slice(1).trim().split(/ +/)[0].toLowerCase();

        const esWeekly = ['weekly', 'semanal'].includes(commandUsed);
        const intervalo = esWeekly ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
        const premio = esWeekly ? 7000 : 35000;
        const columnaTiempo = esWeekly ? 'lastWeekly' : 'lastMonthly';

        // Asegurar columnas de tiempo en base de datos si no existen
        db.run(`ALTER TABLE users ADD COLUMN lastWeekly INTEGER DEFAULT 0`, () => {});
        db.run(`ALTER TABLE users ADD COLUMN lastMonthly INTEGER DEFAULT 0`, () => {});

        db.run(`INSERT OR IGNORE INTO users (jid) VALUES (?)`, [sender], () => {
            db.get(`SELECT wallet, ${columnaTiempo} FROM users WHERE jid = ?`, [sender], async (err, row) => {
                const ultimoReclamo = row && row[columnaTiempo] ? row[columnaTiempo] : 0;

                if (ahora - ultimoReclamo < intervalo) {
                    const tiempoRestante = Math.ceil((intervalo - (ahora - ultimoReclamo)) / (1000 * 60 * 60));
                    return await sock.sendMessage(jid, { 
                        text: `⏳ Ya reclamaste tu recompensa ${esWeekly ? 'semanal' : 'mensual'}. Vuelve en aprox. *${tiempoRestante} hora(s)*.` 
                    }, { quoted: m });
                }

                const nuevaWallet = (row.wallet || 0) + premio;

                db.run(`UPDATE users SET wallet = ?, ${columnaTiempo} = ? WHERE jid = ?`, [nuevaWallet, ahora, sender], async () => {
                    await sock.sendMessage(jid, { 
                        text: `🎁 ¡Has reclamado tu recompensa ${esWeekly ? 'semanal' : 'mensual'} de *+$${premio.toLocaleString()}* coins!` 
                    }, { quoted: m });
                });
            });
        });
    }
};