const db = require('../../database/db');

module.exports = {
    name: 'resetharem',
    aliases: ['cleardb', 'borrarharems'],
    category: 'admin',
    description: 'Borra todos los personajes de todos los harems.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;

        // Ejecución directa sin restricciones
        db.run(`DELETE FROM harem`, [], function(err) {
            if (err) {
                console.error('Error al resetear los harems:', err.message);
                return sock.sendMessage(jid, { text: '「✿」 Hubo un error al vaciar los harems en la base de datos.' }, { quoted: m });
            }

            sock.sendMessage(jid, { 
                text: `「✿」 ¡Listo! Se han eliminado todos los registros de los harems. Total de personajes borrados: *${this.changes}*. 🌸` 
            }, { quoted: m });
        });
    }
};
