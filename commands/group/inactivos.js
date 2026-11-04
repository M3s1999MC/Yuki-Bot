module.exports = {
    name: 'inactivos',
    alias: ['listainactivos'],
    desc: 'Muestra los miembros inactivos del grupo',
    run: async (sock, m, args, db) => {
        if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: '⚠️ Este comando solo funciona en grupos.' }, { quoted: m });

        const metadata = await sock.groupMetadata(m.key.remoteJid);
        const members = metadata.participants.map(p => p.id);

        db.all(`SELECT user_jid FROM message_counts WHERE group_jid = ?`, [m.key.remoteJid], async (err, rows) => {
            if (err) return sock.sendMessage(m.key.remoteJid, { text: '❌ Error al consultar la actividad.' }, { quoted: m });
            
            const activeJids = new Set(rows.map(r => r.user_jid));
            const inactivos = members.filter(jid => !activeJids.has(jid));

            if (inactivos.length === 0) return sock.sendMessage(m.key.remoteJid, { text: '🎉 ¡Increíble! Todos los miembros han enviado al menos un mensaje.' }, { quoted: m });

            let texto = `📉 *MIEMBROS INACTIVOS (${inactivos.length})*\n\n`;
            inactivos.slice(0, 20).forEach((jid, index) => {
                texto += `${index + 1}. @${jid.split('@')[0]}\n`;
            });
            if (inactivos.length > 20) texto += `\n...y ${inactivos.length - 20} más.`;

            await sock.sendMessage(m.key.remoteJid, { text: texto, mentions: inactivos.slice(0, 20) }, { quoted: m });
        });
    }
};
