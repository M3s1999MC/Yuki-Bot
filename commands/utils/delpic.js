const fs = require('fs');
const path = require('path');
const db = require('../../database/db');

const pictureDirectory = path.resolve(__dirname, '../../database/profile_pics');

module.exports = {
    name: 'delpic',
    aliases: ['delavatar'],
    category: 'utilidades',
    description: 'Elimina la imagen personalizada de tu perfil.',

    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const sender = jid.endsWith('@g.us') ? (m.key.participant || jid) : jid;
        db.getSafeUser(sender, (err, user) => {
            if (err) {
                console.error('Error al registrar usuario para quitar imagen:', err.message);
                return sock.sendMessage(jid, { text: '「✿」 No pude consultar tu perfil.' }, { quoted: m });
            }
            if (!user.profile_image) {
                return sock.sendMessage(jid, { text: '「✿」 No tienes una imagen personalizada para eliminar.' }, { quoted: m });
            }
            db.run(`UPDATE users SET profile_image = NULL WHERE jid = ?`, [sender], (updateErr) => {
                if (updateErr) {
                    console.error('Error al quitar imagen de perfil:', updateErr.message);
                    return sock.sendMessage(jid, { text: '「✿」 No se pudo eliminar tu imagen.' }, { quoted: m });
                }
                const filePath = path.resolve(user.profile_image);
                if (filePath.startsWith(`${pictureDirectory}${path.sep}`)) {
                    fs.promises.unlink(filePath).catch(fileErr => {
                        if (fileErr.code !== 'ENOENT') console.error('Error al borrar archivo de perfil:', fileErr);
                    });
                }
                sock.sendMessage(jid, { text: '「✿」 Imagen de perfil eliminada. 🌸' }, { quoted: m });
            });
        });
    }
};
