const db = require('../../database/db'); // Ajusta la ruta a tu archivo db.js si es necesario

module.exports = {
    name: 'resetharem',
    aliases: ['cleardb', 'borrarharems'],
    category: 'admin',
    description: 'Borra todos los personajes de todos los harems.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        
        // Obtenemos el JID del remitente del mensaje
        const sender = m.key.participant || m.key.remoteJid;

        // 🛡️ RESTRICCIÓN DE SEGURIDAD: Reemplaza tu número de WhatsApp aquí abajo 
        // para que solo tú puedas usar este comando (ejemplo: '573147895286@s.whatsapp.net')
        const ownerJid = '573147895286@s.whatsapp.net'; // <--- Cambia o añade tu JID exacto si es necesario

        if (!sender.includes('573147895286')) { // Validación rápida de tu número
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
