const db = require('../../database/db'); // Ajusta la ruta a tu archivo db.js

module.exports = {
    name: 'resetharem',
    category: 'admin',
    description: 'Borra todos los personajes de todos los harems.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;

        // Opcional: Validar si el usuario es el propietario del bot para mayor seguridad
        // if (m.key.participant !== 'tu_numero@s.whatsapp.net' && m.key.remoteJid !== 'tu_numero@s.whatsapp.net') return;

        db.run(`DELETE FROM harem`, [], function(err) {
            if (err) {
                console.error('Error al resetear los harems:', err.message);
                return sock.sendMessage(jid, { text: '「✿」 Hubo un error al vaciar los harems.' }, { quoted: m });
            }

            sock.sendMessage(jid, { 
                text: `「✿」 ¡Listo! Se han borrado todos los registros de los harems de la base de datos. Se eliminaron ${this.changes} personajes en total. 🌸` 
            }, { quoted: m });
        });
    }
};
