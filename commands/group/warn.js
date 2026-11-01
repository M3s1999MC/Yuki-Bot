const db = require('../../database/db');

module.exports = {
    name: 'warn',
    aliases: ['advertir'],
    adminOnly: true,
    category: 'grupo',
    description: 'Advierte a un miembro y lo expulsa al alcanzar el límite del grupo.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '「✿」 Este comando solo funciona en grupos.' }, { quoted: m });
        }

        const context = m.message?.extendedTextMessage?.contextInfo;
        const target = context?.mentionedJid?.[0] || context?.participant;
        if (!target) {
            return sock.sendMessage(jid, { text: '「✿」 Menciona o responde al miembro que recibirá la advertencia.' }, { quoted: m });
        }
        if (target === (m.key.participant || jid)) {
            return sock.sendMessage(jid, { text: '「✿」 No puedes advertirte a ti mismo.' }, { quoted: m });
        }

        const reason = args.filter(arg => !/^@\d+$/.test(arg)).join(' ').trim() || 'Sin razón especificada';
        db.getSafeGroup(jid, (groupErr, settings) => {
            if (groupErr) {
                console.error('Error al consultar el límite de advertencias:', groupErr.message);
                return sock.sendMessage(jid, { text: '「✿」 No pude consultar la configuración de advertencias.' }, { quoted: m });
            }

            db.run(`INSERT INTO warnings (group_jid, user_jid, reason) VALUES (?, ?, ?)`, [jid, target, reason], (insertErr) => {
                if (insertErr) {
                    console.error('Error al guardar advertencia:', insertErr.message);
                    return sock.sendMessage(jid, { text: '「✿」 No se pudo guardar la advertencia.' }, { quoted: m });
                }

                db.get(`SELECT COUNT(*) AS total FROM warnings WHERE group_jid = ? AND user_jid = ?`, [jid, target], async (countErr, row) => {
                    if (countErr) {
                        console.error('Error al contar advertencias:', countErr.message);
                        return sock.sendMessage(jid, { text: '「✿」 La advertencia quedó registrada, pero no pude verificar el límite.' }, { quoted: m });
                    }

                    const count = row?.total || 0;
                    const limit = settings.warn_limit || 3;
                    if (count >= limit) {
                        try {
                            await sock.groupParticipantsUpdate(jid, [target], 'remove');
                        } catch (kickErr) {
                            console.error('Error al expulsar al alcanzar el límite de advertencias:', kickErr);
                            await sock.sendMessage(jid, {
                                text: `「✿」 @${target.split('@')[0]} alcanzó ${count}/${limit} advertencias, pero no pude expulsarlo. Revisa los permisos del bot.`,
                                mentions: [target]
                            }, { quoted: m });
                            return;
                        }
                        db.run(`DELETE FROM warnings WHERE group_jid = ? AND user_jid = ?`, [jid, target], (deleteErr) => {
                            if (deleteErr) console.error('Error al limpiar advertencias tras expulsión:', deleteErr.message);
                        });
                        return sock.sendMessage(jid, {
                            text: `「✿」 @${target.split('@')[0]} alcanzó el límite de ${limit} advertencias y fue expulsado. 👢`,
                            mentions: [target]
                        }, { quoted: m });
                    }

                    sock.sendMessage(jid, {
                        text: `「✿」 Advertencia registrada para @${target.split('@')[0]} (*${count}/${limit}*).\nMotivo: ${reason}`,
                        mentions: [target]
                    }, { quoted: m });
                });
            });
        });
    }
};
