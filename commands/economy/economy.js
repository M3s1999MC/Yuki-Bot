const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

// Función auxiliar para formatear dinero
const fmt = (n) => n.toLocaleString('en-US');

module.exports = {
    name: 'economy',
    aliases: [],
    category: 'economy',
    description: 'Sistema completo de economía y transacciones monetarias seguras.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const body = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const prefix = '!';
        const commandUsed = body.slice(prefix.length).trim().split(/ +/)[0].toLowerCase();

        // Asegurar que el usuario existe en la tabla
        db.run(`INSERT OR IGNORE INTO users (jid, balance, bank) VALUES (?, 0, 0)`, [sender]);

        // --- 1. SALDO (.balance | .bal | .saldo) ---
        if (['balance', 'bal', 'saldo'].includes(commandUsed)) {
            db.get(`SELECT balance, bank FROM users WHERE jid = ?`, [sender], async (err, row) => {
                const bal = row ? row.balance : 0;
                const bank = row ? row.bank : 0;
                const total = bal + bank;

                const text = `🏦 *ESTADO FINANCIERO*\n\n` +
                    `👤 Usuario: @${sender.split('@')[0]}\n` +
                    `💵 Efectivo: *$${fmt(bal)}*\n` +
                    `💳 Banco: *$${fmt(bank)}*\n` +
                    `💎 Total: *$${fmt(total)}*`;

                await sock.sendMessage(jid, { text, mentions: [sender] }, { quoted: m });
            });
            return;
        }

        // --- 2. DEPOSITAR (.deposit | .dep) ---
        if (['deposit', 'depositar', 'dep'].includes(commandUsed)) {
            const amountArg = args[0];
            db.get(`SELECT balance FROM users WHERE jid = ?`, [sender], async (err, row) => {
                if (!row || row.balance <= 0) {
                    return await sock.sendMessage(jid, { text: '❌ No tienes efectivo para depositar.' }, { quoted: m });
                }

                let amount = amountArg?.toLowerCase() === 'all' || amountArg?.toLowerCase() === 'todo' 
                    ? row.balance 
                    : parseFloat(amountArg);

                if (isNaN(amount) || amount <= 0) {
                    return await sock.sendMessage(jid, { text: '⚠️ Indica una cantidad válida o usa `.dep all`.' }, { quoted: m });
                }

                if (amount > row.balance) {
                    return await sock.sendMessage(jid, { text: `❌ No tienes tanto efectivo. Tu saldo actual es $${fmt(row.balance)}.` }, { quoted: m });
                }

                // TRANSACCIÓN SEGURA (Regla 4)
                db.serialize(() => {
                    db.run('BEGIN TRANSACTION');
                    db.run(`UPDATE users SET balance = balance - ?, bank = bank + ? WHERE jid = ?`, [amount, amount, sender], (err) => {
                        if (err) {
                            db.run('ROLLBACK');
                            return sock.sendMessage(jid, { text: '❌ Error en la transacción bancaria.' }, { quoted: m });
                        }
                        db.run('COMMIT', async () => {
                            await sock.sendMessage(jid, { text: `✅ Has depositado *$${fmt(amount)}* en tu cuenta bancaria.` }, { quoted: m });
                        });
                    });
                });
            });
            return;
        }

        // --- 3. RETIRAR (.withdraw | .wd) ---
        if (['withdraw', 'retirar', 'wd'].includes(commandUsed)) {
            const amountArg = args[0];
            db.get(`SELECT bank FROM users WHERE jid = ?`, [sender], async (err, row) => {
                if (!row || row.bank <= 0) {
                    return await sock.sendMessage(jid, { text: '❌ No tienes dinero en el banco.' }, { quoted: m });
                }

                let amount = amountArg?.toLowerCase() === 'all' || amountArg?.toLowerCase() === 'todo' 
                    ? row.bank 
                    : parseFloat(amountArg);

                if (isNaN(amount) || amount <= 0) {
                    return await sock.sendMessage(jid, { text: '⚠️ Indica una cantidad válida o usa `.wd all`.' }, { quoted: m });
                }

                if (amount > row.bank) {
                    return await sock.sendMessage(jid, { text: `❌ No tienes tanto en el banco. Tu saldo es $${fmt(row.bank)}.` }, { quoted: m });
                }

                // TRANSACCIÓN SEGURA (Regla 4)
                db.serialize(() => {
                    db.run('BEGIN TRANSACTION');
                    db.run(`UPDATE users SET bank = bank - ?, balance = balance + ? WHERE jid = ?`, [amount, amount, sender], (err) => {
                        if (err) {
                            db.run('ROLLBACK');
                            return sock.sendMessage(jid, { text: '❌ Error al retirar fondos.' }, { quoted: m });
                        }
                        db.run('COMMIT', async () => {
                            await sock.sendMessage(jid, { text: `✅ Has retirado *$${fmt(amount)}* de tu banco.` }, { quoted: m });
                        });
                    });
                });
            });
            return;
        }

        // --- 4. TRABAJAR (.work | .trabajar) ---
        if (['work', 'trabajar'].includes(commandUsed)) {
            const earnings = Math.floor(Math.random() * 800) + 200; // Entre 200 y 1000
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');
                db.run(`UPDATE users SET balance = balance + ? WHERE jid = ?`, [earnings, sender], (err) => {
                    if (err) {
                        db.run('ROLLBACK');
                        return;
                    }
                    db.run('COMMIT', async () => {
                        const works = ['programando un bot en Godot y Node.js', 'reparando servidores', 'diseñando animaciones 3D', 'vendiendo arepas artesanales'];
                        const job = works[Math.floor(Math.random() * works.length)];
                        await sock.sendMessage(jid, { text: `💼 Trabajaste duro ${job} y ganaste *$${fmt(earnings)}*.` }, { quoted: m });
                    });
                });
            });
            return;
        }

        // --- 5. TRANSFERIR (.transfer | .pay | .dar) ---
        if (['transfer', 'transferir', 'pay', 'dar'].includes(commandUsed)) {
            const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                              m.message?.extendedTextMessage?.contextInfo?.participant;
            const amount = parseFloat(args[1] || args[0]);

            if (!mentioned || isNaN(amount) || amount <= 0) {
                return await sock.sendMessage(jid, { text: '⚠️ Uso correcto: `.pay @usuario cantidad`' }, { quoted: m });
            }

            if (mentioned === sender) {
                return await sock.sendMessage(jid, { text: '❌ No puedes transferirte dinero a ti mismo.' }, { quoted: m });
            }

            db.get(`SELECT balance FROM users WHERE jid = ?`, [sender], async (err, row) => {
                if (!row || row.balance < amount) {
                    return await sock.sendMessage(jid, { text: `❌ No tienes suficiente efectivo. Tu saldo es $${fmt(row?.balance || 0)}.` }, { quoted: m });
                }

                // TRANSACCIÓN ATÓMICA SEGURA ENTRE DOS CUENTAS (Regla 4)
                db.serialize(() => {
                    db.run('BEGIN TRANSACTION');
                    db.run(`INSERT OR IGNORE INTO users (jid, balance, bank) VALUES (?, 0, 0)`, [mentioned]);
                    
                    db.run(`UPDATE users SET balance = balance - ? WHERE jid = ?`, [amount, sender], (err1) => {
                        if (err1) {
                            db.run('ROLLBACK');
                            return sock.sendMessage(jid, { text: '❌ Error en la transferencia.' }, { quoted: m });
                        }

                        db.run(`UPDATE users SET balance = balance + ? WHERE jid = ?`, [amount, mentioned], (err2) => {
                            if (err2) {
                                db.run('ROLLBACK');
                                return sock.sendMessage(jid, { text: '❌ Error al abonar al destinatario.' }, { quoted: m });
                            }

                            db.run('COMMIT', async () => {
                                await sock.sendMessage(jid, { 
                                    text: `💸 Transacción exitosa.\nHas transferido *$${fmt(amount)}* a @${mentioned.split('@')[0]}.`, 
                                    mentions: [mentioned] 
                                }, { quoted: m });
                            });
                        });
                    });
                });
            });
            return;
        }

        // --- 6. RANKING DE RIQUEZA (.leaderboard | .top | .ranking) ---
        if (['leaderboard', 'top', 'ranking'].includes(commandUsed)) {
            db.all(`SELECT jid, (balance + bank) as total FROM users ORDER BY total DESC LIMIT 10`, [], async (err, rows) => {
                if (err || !rows || rows.length === 0) {
                    return await sock.sendMessage(jid, { text: '📊 No hay datos de riqueza registrados.' }, { quoted: m });
                }
                let topText = `🏆 *TOP 10 - MILLONARIOS DE CUARTEL* 🏆\n\n`;
                rows.forEach((r, idx) => {
                    topText += `${idx + 1}. @${r.jid.split('@')[0]} — *$${fmt(r.total)}*\n`;
                });
                const mentions = rows.map(r => r.jid);
                await sock.sendMessage(jid, { text: topText, mentions }, { quoted: m });
            });
        }
    }
};