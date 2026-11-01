const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const db = require('../../database/db');

const pictureDirectory = path.resolve(__dirname, '../../database/profile_pics');

module.exports = {
    name: 'setpic',
    aliases: ['setavatar', 'setperfilpic'],
    category: 'utilidades',
    description: 'Establece la imagen de tu perfil de Yuki.',

    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const sender = jid.endsWith('@g.us') ? (m.key.participant || jid) : jid;
        const context = m.message?.extendedTextMessage?.contextInfo;
        const quotedMessage = context?.quotedMessage;
        const source = m.message?.imageMessage
            ? m
            : quotedMessage?.imageMessage
                ? { key: m.key, message: quotedMessage }
                : null;
        if (!source) {
            return sock.sendMessage(jid, { text: '「✿」 Envía o responde a una imagen con !setpic.' }, { quoted: m });
        }

        try {
            const buffer = await downloadMediaMessage(source, 'buffer', {}, { logger: console });
            const image = await sharp(buffer).rotate().resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 88 }).toBuffer();
            await fs.promises.mkdir(pictureDirectory, { recursive: true });
            const filePath = path.join(pictureDirectory, `${crypto.createHash('sha256').update(sender).digest('hex')}-${Date.now()}.jpg`);
            await fs.promises.writeFile(filePath, image);

            db.getSafeUser(sender, (ensureErr, user) => {
                if (ensureErr) {
                    console.error('Error al registrar usuario para imagen de perfil:', ensureErr.message);
                    return fs.promises.unlink(filePath)
                        .catch(cleanErr => console.error('Error al limpiar imagen no guardada:', cleanErr))
                        .then(() => sock.sendMessage(jid, { text: '「✿」 No pude preparar tu perfil.' }, { quoted: m }));
                }
                db.run(`UPDATE users SET profile_image = ? WHERE jid = ?`, [filePath, sender], (updateErr) => {
                    if (updateErr) {
                        console.error('Error al guardar imagen de perfil:', updateErr.message);
                        return fs.promises.unlink(filePath)
                            .catch(cleanErr => console.error('Error al limpiar imagen no guardada:', cleanErr))
                            .then(() => sock.sendMessage(jid, { text: '「✿」 No se pudo guardar tu imagen.' }, { quoted: m }));
                    }
                    const previousPath = user.profile_image && path.resolve(user.profile_image);
                    if (previousPath && previousPath.startsWith(`${pictureDirectory}${path.sep}`) && previousPath !== filePath) {
                        fs.promises.unlink(previousPath).catch(cleanErr => {
                            if (cleanErr.code !== 'ENOENT') console.error('Error al eliminar imagen anterior:', cleanErr);
                        });
                    }
                    sock.sendMessage(jid, { text: '「✿」 Imagen de perfil actualizada. 🌸' }, { quoted: m });
                });
            });
        } catch (err) {
            console.error('Error al procesar imagen de perfil:', err);
            await sock.sendMessage(jid, { text: '「✿」 No se pudo procesar la imagen.' }, { quoted: m });
        }
    }
};
