const db = require('../../database/db');

module.exports = {
    name: 'resetharem',
    aliases: ['cleardb', 'borrarharems'],
    category: 'admin',
    description: 'Borra todos los personajes de todos los harems.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        
        // Extraemos el número limpio de quien ejecuta el mensaje
        const sender = m.key.participant || m.key.remoteJid;
        const senderNumber = sender.split('@')[0];

        // Lista de números administradores / creadores permitidos
        const owners = ['573147895286']; // Añade aquí tu número exacto sin '@s.whatsapp.net' si usas otro

        if (!owners.includes(senderNumber)) {
            return sock.sendMessage(jid, { text: '「✿」 Este comando es exclusivo para el creador del bot.' }, { quoted: m });
        }

        db.run(`DELETE FROM harem`, [], function(err) {
            if (err) {
                console.error('Error al resetear los harems:', err.message);
                return sock.sendMessage(jid, { text: '「✿」 Hubo un error al vaciar los harems en la base de datos.' }, { quoted: m });
            }

            sock.sendMessage(jid, { 
                text: `「✿」 ¡Operación exitosa! Se han eliminado todos los registros de los harems. Total de personajes borrados: *${this.changes}*. 🌸` 
            }, { quoted: m });
        });
    }
};
