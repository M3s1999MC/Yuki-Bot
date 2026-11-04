module.exports = {
    name: 'deltitulo',
    alias: ['deltitle', 'quitarTitulo'],
    desc: 'Elimina tu título personalizado de perfil',
    run: async (sock, m, args, db) => {
        const jid = m.key.participant || m.key.remoteJid;
        db.run(`UPDATE users SET bio = 'Sin asignar' WHERE jid = ?`, [jid], async (err) => {
            if (err) return sock.sendMessage(m.key.remoteJid, { text: '❌ Error al quitar el título.' }, { quoted: m });
            await sock.sendMessage(m.key.remoteJid, { text: '🗑️ Tu título personalizado ha sido eliminado.' }, { quoted: m });
        });
    }
};
