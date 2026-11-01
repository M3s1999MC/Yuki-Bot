const db = require('../../database/db');
const { checkAdmin } = require('../../utils/permissions');

module.exports = {
    name: 'warnings_legacy',
    aliases: [],
    category: 'admin',
    description: 'Aplica, consulta y gestiona el sistema de advertencias del grupo.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;

        if (!jid.endsWith('@g.us')) return;

        const body = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const prefix = '.';
        const commandUsed = body.slice(prefix.length).trim().split(/ +/)[0].toLowerCase();

        const { isUserAdmin, isBotAdmin } = await checkAdmin(sock, jid, sender);

        // --- CONSULTAR ADVERTENCIAS DE UN USUARIO (.listwarn / .warnings) ---
        if (['listwarn', 'warnings', 'advertencias'].includes(commandUsed)) {
            const targetJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                              m.message?.extendedTextMessage?.contextInfo?.participant || sender;

            db.all(`SELECT reason FROM warnings WHERE user_jid = ? AND group_jid = ?`, [targetJid, jid], async (err, rows) => {
                const count = rows ? rows.length : 0;
                let text = `⚠️ *ADVERTENCIAS DE @${targetJid.split('@')[0]}*\nTotal: *${count}*\n`;
                if (rows && rows.length > 0) {
                    text += `\nRazones:\n` + rows.map((r, i) => `${i + 1}. ${r.reason}`).join('\n');
                }
                return await sock.sendMessage(jid, { text, mentions: [targetJid] }, { quoted: m });
            });
            return;
        }

        // Para aplicar o eliminar advertencias se requiere ser administrador
        if (!isUserAdmin) {
            return await sock.sendMessage(jid, { text: '⚠️ Solo los administradores pueden modificar las advertencias.' }, { quoted: m });
        }

        // --- APLICAR ADVERTENCIA (.warn / .advertir) ---
        if (['warn', 'advertir'].includes(commandUsed)) {
            const targetJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                              m.message?.extendedTextMessage?.contextInfo?.participant;

            if (!targetJid) {
                return await sock.sendMessage(jid, { text: '⚠️ Debes mencionar o responder al mensaje del usuario a advertir.' }, { quoted: m });
            }

            const reason = args.join(' ') || 'Sin razón especificada';

            db.run(`INSERT INTO warnings (user_jid, group_jid, reason) VALUES (?, ?, ?)`, [targetJid, jid, reason], function(err) {
                if (err) return;

                db.all(`SELECT id FROM warnings WHERE user_jid = ? AND group_jid = ?`, [targetJid, jid], async (err, rows) => {
                    const warnCount = rows ? rows.length : 1;
                    const maxWarns = 3; // Límite predeterminado

                    let msg = `⚠️ *ADVERTENCIA APLICADA* ⚠️\n\n👤 Usuario: @${targetJid.split('@')[0]}\n📝 Razón: ${reason}\n📊 Advertencias: *${warnCount}/${maxWarns}*`;

                    if (warnCount >= maxWarns) {
                        msg += `\n\n🚨 El usuario ha alcanzado el límite de advertencias.`;
                        if (isBotAdmin) {
                            msg += ` Procediendo a expulsar...`;
                            await sock.sendMessage(jid, { text: msg, mentions: [targetJid] }, { quoted: m });
                            await sock.groupParticipantsUpdate(jid, [targetJid], 'remove');
                            db.run(`DELETE FROM warnings WHERE user_jid = ? AND group_jid = ?`, [targetJid, jid]);
                            return;
                        }
                    }

                    return await sock.sendMessage(jid, { text: msg, mentions: [targetJid] }, { quoted: m });
                });
            });
            return;
        }

        // --- ELIMINAR ADVERTENCIAS (.delwarn / .eliminaradvertencia) ---
        if (['delwarn', 'eliminaradvertencia'].includes(commandUsed)) {
            const targetJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                              m.message?.extendedTextMessage?.contextInfo?.participant;

            if (!targetJid) {
                return await sock.sendMessage(jid, { text: '⚠️ Menciona o responde al usuario al que deseas quitar advertencias.' }, { quoted: m });
            }

            db.run(`DELETE FROM warnings WHERE user_jid = ? AND group_jid = ?`, [targetJid, jid], async (err) => {
                return await sock.sendMessage(jid, { text: `✅ Se han eliminado todas las advertencias de @${targetJid.split('@')[0]}.`, mentions: [targetJid] }, { quoted: m });
            });
        }
    }
};