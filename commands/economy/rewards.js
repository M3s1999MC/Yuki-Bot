const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'rewards',
    aliases: ['recompensa', 'diaria', 'daily', 'claim'],
    category: 'economy',
    description: 'Reclama tus recompensas periódicas (diaria, semanal o mensual) en Bolívares.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const username = sender.split('@')[0];
        
        // Detectar el comando exacto utilizado
        const body = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const commandUsed = body.slice(1).trim().split(/ +/)[0].toLowerCase();

        let reward = 2500; // Recompensa diaria por defecto
        let title = 'Diaria';
        let intervalo = 24 * 60 * 60 * 1000; // 24 horas
        let columnaTiempo = 'lastDaily';

        if (['weekly', 'semanal'].includes(commandUsed)) {
            reward = 15000;
            title = 'Semanal';
            intervalo = 7 * 24 * 60 * 60 * 1000;
            columnaTiempo = 'lastWeekly';
        } else if (['monthly', 'mensual'].includes(commandUsed)) {
            reward = 60000;
            title = 'Mensual';
            intervalo = 30 * 24 * 60 * 60 * 1000;
            columnaTiempo = 'lastMonthly';
        }

        // Asegurar columnas de tiempo en la base de datos si no existen
        db.run(`ALTER TABLE users ADD COLUMN lastDaily INTEGER DEFAULT 0`, () => {});
        db.run(`ALTER TABLE users ADD COLUMN lastWeekly INTEGER DEFAULT 0`, () => {});
        db.run(`ALTER TABLE users ADD COLUMN lastMonthly INTEGER DEFAULT 0`, () => {});

        db.run(`INSERT OR IGNORE INTO users (jid, name, wallet) VALUES (?, ?, 0)`, [sender, username], () => {
            db.get(`SELECT wallet, ${columnaTiempo} FROM users WHERE jid = ?`, [sender], async (err, row) => {
                if (err) {
                    console.error('Error al consultar recompensas:', err.message);
                    return sock.sendMessage(jid, { 
                        text: '「✿」 ERROR DE RED // No pude verificar tu estado en el sistema. 🥀' 
                    }, { quoted: m });
                }

                const ahora = Date.now();
                const ultimoReclamo = row && row[columnaTiempo] ? row[columnaTiempo] : 0;

                if (ahora - ultimoReclamo < intervalo) {
                    const tiempoRestanteMs = intervalo - (ahora - ultimoReclamo);
                    const horas = Math.floor(tiempoRestanteMs / (1000 * 60 * 60));
                    const minutos = Math.floor((tiempoRestanteMs % (1000 * 60 * 60)) / (1000 * 60));
                    const dias = Math.floor(horas / 24);
                    const horasRestantes = horas % 24;

                    let tiempoTexto = dias > 0 ? `${dias}d ${horasRestantes}h` : `${horas}h ${minutos}m`;

                    return await sock.sendMessage(jid, { 
                        text: `「✿」 RECOMPENSA ${title.toUpperCase()} YA RECLAMADA ⏳\n\n` +
                              `₊˚ˑ༄ Ya cobraste tu bonificación ${title.toLowerCase()} recientemente.\n` +
                              `❀ Podrás volver a reclamar en: *${tiempoTexto}* ☕` 
                    }, { quoted: m });
                }

                const walletActual = row ? (Number(row.wallet) || 0) : 0;
                const nuevaWallet = walletActual + reward;

                db.run(
                    `UPDATE users SET wallet = ?, ${columnaTiempo} = ? WHERE jid = ?`,
                    [nuevaWallet, ahora, sender],
                    async (updateErr) => {
                        if (updateErr) {
                            console.error('Error al actualizar recompensa:', updateErr.message);
                            return sock.sendMessage(jid, { 
                                text: '「✿」 ERROR CRÍTICO // No se pudo acreditar la recompensa en tu billetera. 🥀' 
                            }, { quoted: m });
                        }

                        const rewardFormatted = reward.toLocaleString('es-CO');

                        const text = `「✿」 RECOMPENSA ${title.toUpperCase()} RECLAMADA 🎁✨\n\n` +
                                     `₊˚ˑ༄ Has recibido tu bonificación periódica con éxito.\n` +
                                     `❀ 👤 *Usuario:* @${username}\n` +
                                     `❀ 💰 *Fondos acreditados:* \`+$${rewardFormatted} Bolívares\` 💵\n` +
                                     `───────────────────\n` +
                                     `❀ _¡Gracias por tu constancia en la red de Yuki!_ 🌸`;

                        await sock.sendMessage(jid, { text, mentions: [sender] }, { quoted: m });
                    }
                );
            });
        });
    }
};
