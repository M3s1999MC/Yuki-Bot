const db = require('../../database/db');

module.exports = {
    name: 'marriage',
    aliases: [],
    category: 'general',
    description: 'Permite casarse o divorciarse con otro usuario.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;
        const body = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const prefix = '!';
        const commandUsed = body.slice(prefix.length).trim().split(/ +/)[0].toLowerCase();

        db.run(`INSERT OR IGNORE INTO users (jid) VALUES (?)`, [sender]);

        // --- COMANDO CASARSE (.marry | .casarse) ---
        if (['marry', 'casarse'].includes(commandUsed)) {
            const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                              m.message?.extendedTextMessage?.contextInfo?.participant;

            if (!mentioned) {
                return await sock.sendMessage(jid, { text: '⚠️ Debes mencionar o responder al mensaje de la persona con la que deseas casarte.' }, { quoted: m });
            }

            if (mentioned === sender) {
                return await sock.sendMessage(jid, { text: '❌ No puedes casarte contigo mismo.' }, { quoted: m });
            }

            db.get(`SELECT partner FROM users WHERE jid = ?`, [sender], (err, user) => {
                if (user && user.partner) {
                    return sock.sendMessage(jid, { text: '❌ Ya estás casado/a. Debes divorciarte primero con `.divorce`.' }, { quoted: m });
                }

                db.get(`SELECT partner FROM users WHERE jid = ?`, [mentioned], async (err, target) => {
                    if (target && target.partner) {
                        return await sock.sendMessage(jid, { text: '❌ Esa persona ya está casada con alguien más.' }, { quoted: m });
                    }

                    // Registrar matrimonio para ambos
                    db.run(`UPDATE users SET partner = ? WHERE jid = ?`, [mentioned, sender]);
                    db.run(`INSERT OR IGNORE INTO users (jid) VALUES (?)`, [mentioned]);
                    db.run(`UPDATE users SET partner = ? WHERE jid = ?`, [sender, mentioned]);

                    const weddingMsg = `💍 *¡NUEVO MATRIMONIO EN CUARTEL!* 💍\n\n🎉 ¡Felicidades @${sender.split('@')[0]} y @${mentioned.split('@')[0]}! Ahora están oficialmente casados. ❤️`;
                    await sock.sendMessage(jid, { text: weddingMsg, mentions: [sender, mentioned] }, { quoted: m });
                });
            });
            return;
        }

        // --- COMANDO DIVORCIARSE (.divorce | .divorciarse) ---
        if (['divorce', 'divorciarse'].includes(commandUsed)) {
            db.get(`SELECT partner FROM users WHERE jid = ?`, [sender], async (err, user) => {
                if (!user || !user.partner) {
                    return await sock.sendMessage(jid, { text: '❌ Actualmente no estás casado/a con nadie.' }, { quoted: m });
                }

                const exPartner = user.partner;

                // Limpiar partner en ambos lados
                db.run(`UPDATE users SET partner = NULL WHERE jid = ?`, [sender]);
                db.run(`UPDATE users SET partner = NULL WHERE jid = ?`, [exPartner]);

                const divMsg = `💔 @${sender.split('@')[0]} se ha divorciado de @${exPartner.split('@')[0]}. ¡Han vuelto a la soltería!`;
                await sock.sendMessage(jid, { text: divMsg, mentions: [sender, exPartner] }, { quoted: m });
            });
        }
    }
};