const db = require('../../database/db');

module.exports = {
    name: 'divorce',
    aliases: ['divorciarse'],
    category: 'general',
    description: 'Finaliza tu relación actual.',

    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const sender = jid.endsWith('@g.us') ? (m.key.participant || jid) : jid;
        db.getSafeUser(sender, (err, user) => {
            if (err) {
                console.error('Error al consultar pareja para divorcio:', err.message);
                return sock.sendMessage(jid, { text: '「✿」 No pude consultar tu perfil.' }, { quoted: m });
            }
            const partner = user.married;
            if (!partner || partner.startsWith('Nadie')) {
                return sock.sendMessage(jid, { text: '「✿」 No tienes una pareja registrada. 💔' }, { quoted: m });
            }
            db.run(`UPDATE users SET married = 'Nadie 💔' WHERE jid = ?`, [sender], (selfErr) => {
                if (selfErr) {
                    console.error('Error al actualizar divorcio:', selfErr.message);
                    return sock.sendMessage(jid, { text: '「✿」 No se pudo completar el divorcio.' }, { quoted: m });
                }
                const partnerIsJid = /^.+@(?:s\.whatsapp\.net|lid)$/.test(partner);
                if (partnerIsJid) {
                    db.run(`UPDATE users SET married = 'Nadie 💔' WHERE jid = ? AND married = ?`, [partner, sender], (partnerErr) => {
                        if (partnerErr) console.error('Error al actualizar estado de la expareja:', partnerErr.message);
                    });
                }
                const partnerTag = partnerIsJid ? `@${partner.split('@')[0]}` : partner.replace(/^@/, '@');
                sock.sendMessage(jid, {
                    text: `「✿」 El vínculo entre @${sender.split('@')[0]} y ${partnerTag} terminó. 💔`,
                    mentions: [sender, ...(partnerIsJid ? [partner] : [])]
                }, { quoted: m });
            });
        });
    }
};
