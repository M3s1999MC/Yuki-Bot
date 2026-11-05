const db = require('../database/db');

module.exports = {
    name: 'delintereses',
    aliases: ['quitargustos', 'delhobby', 'removehobby'],
    description: 'Elimina los intereses de tu perfil',
    async execute(sock, m) {
        const jid = m.key.participant || m.key.remoteJid;
        db.run(`UPDATE users SET hobby = 'Sin asignar' WHERE jid = ?`, [jid], async (err) => {
            if (err) return sock.sendMessage(m.key.remoteJid, { text: '❌ Error al eliminar tus intereses.' }, { quoted: m });
            await sock.sendMessage(m.key.remoteJid, { text: '🗑️ Tus intereses se han eliminado del perfil.' }, { quoted: m });
        });
    }
};
