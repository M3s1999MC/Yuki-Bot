const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'marry',
    aliases: ['casarse'],
    category: 'general',
    description: 'Cásate con alguien mencionándolo o respondiendo a su mensaje.',

    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const context = m.message?.extendedTextMessage?.contextInfo;
        const target = context?.mentionedJid?.[0] || context?.participant;
        if (!target) {
            return sock.sendMessage(jid, { text: '「✿」 Menciona o responde a la persona con quien quieres casarte.' }, { quoted: m });
        }
        if (target === sender) {
            return sock.sendMessage(jid, { text: '「✿」 No puedes casarte contigo mismo.' }, { quoted: m });
        }

        db.getSafeUser(sender, (senderErr, currentUser) => {
            if (senderErr) {
                console.error('Error al registrar usuario para matrimonio:', senderErr.message);
                return sock.sendMessage(jid, { text: '「✿」 No pude preparar tu perfil.' }, { quoted: m });
            }
            if (currentUser.married && !currentUser.married.startsWith('Nadie')) {
                return sock.sendMessage(jid, { text: '「✿」 Ya tienes pareja; primero debes usar !divorce.' }, { quoted: m });
            }
            db.getSafeUser(target, (targetErr, targetUser) => {
                if (targetErr) {
                    console.error('Error al registrar pareja:', targetErr.message);
                    return sock.sendMessage(jid, { text: '「✿」 No pude preparar el perfil de la otra persona.' }, { quoted: m });
                }
                if (targetUser.married && !targetUser.married.startsWith('Nadie')) {
                    return sock.sendMessage(jid, { text: '「✿」 Esa persona ya tiene pareja.' }, { quoted: m });
                }

                db.run(`UPDATE users SET married = ? WHERE jid = ?`, [target, sender], (firstErr) => {
                    if (firstErr) {
                        console.error('Error al actualizar matrimonio:', firstErr.message);
                        return sock.sendMessage(jid, { text: '「✿」 No se pudo registrar el matrimonio.' }, { quoted: m });
                    }
                    db.run(`UPDATE users SET married = ? WHERE jid = ?`, [sender, target], (secondErr) => {
                        if (secondErr) {
                            console.error('Error al actualizar pareja del matrimonio:', secondErr.message);
                            db.run(`UPDATE users SET married = 'Nadie 💔' WHERE jid = ?`, [sender], (rollbackErr) => {
                                if (rollbackErr) console.error('Error al revertir matrimonio incompleto:', rollbackErr.message);
                            });
                            return sock.sendMessage(jid, { text: '「✿」 No se pudo completar el matrimonio.' }, { quoted: m });
                        }
                        sock.sendMessage(jid, {
                            text: `「✿」 ¡@${sender.split('@')[0]} y @${target.split('@')[0]} ahora son pareja! 💍🌸`,
                            mentions: [sender, target]
                        }, { quoted: m });
                    });
                });
            });
        });
    }
};
