const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');
const marry = require('./marry');

module.exports = {
    name: 'aceptar',
    aliases: ['accept'],
    category: 'profile',
    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock); // el que acepta = M

        const propuesta = marry.pending.get(sender);
        console.log('ACEPTAR DEBUG - soy:', sender, 'propuesta:', propuesta);

        if (!propuesta) {
            return sock.sendMessage(jid, { text: 'No tienes ninguna propuesta pendiente. Que te hagan !marry @M primero.' }, { quoted: m });
        }

        const novio = propuesta.sender; // el que propuso
        clearTimeout(propuesta.timeout);
        marry.pending.delete(sender);

        // --- AQUÍ ES DONDE SE GUARDA EN PROFILE ---
        // Guarda en los 2 lados
        const guardar = async (userId, pareja) => {
            if (db.updateUser) return db.updateUser(userId, { married: pareja });
            if (db.setUser) return db.setUser(userId, { married: pareja });
            if (db.updateUserData) return db.updateUserData(userId, { married: pareja });
            console.log('ACEPTAR: no encontré función para guardar en db.js');
        };

        await guardar(novio, sender);
        await guardar(sender, novio);

        await sock.sendMessage(jid, {
            text: `「✿」 ¡SE CASARON! 💍🌸\n\n${novio.split('@')[0]} y ${sender.split('@')[0]} ahora son pareja! 💕\nYa les sale en !profile`
        }, { quoted: m });
    }
};
