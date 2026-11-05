const db = require('../database/db');

module.exports = {
    name: 'deltitulo',
    aliases: ['deltitle', 'quitartitulo'],
    description: 'Elimina tu título personalizado de perfil',
    async execute(sock, m) {
        const jid = m.key.participant || m.key.remoteJid;
        db.run(`UPDATE users SET bio = 'Sin asignar' WHERE jid = ?`, [jid], async (err) => {
            if (err) return sock.sendMessage(m.key.remoteJid, { text: '❌ Error al quitar el título.' }, { quoted: m });
            await sock.sendMessage(m.key.remoteJid, { text: '🗑️ Tu título personalizado ha sido eliminado.' }, { quoted: m });
        });
    }
};
