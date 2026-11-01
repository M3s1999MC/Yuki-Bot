const db = require('../../database/db');

module.exports = {
    name: 'setwelcome',
    aliases: [
        'setbienvenida', 'setwelcomeimg', 'setbienvenidaimg', 'welcomeimg', 'setwelcomegif',
        'testwelcome', 'probarbienvenida', 'previewwelcome', 'setgoodbye', 'setdespedida'
    ],
    adminOnly: true,
    category: 'grupo',
    description: 'Personaliza y prueba los mensajes de bienvenida y despedida.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '「✿」 Este comando solo funciona en grupos.' }, { quoted: m });
        }

        const body = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const command = body.replace(/^!/, '').trim().split(/\s+/)[0].toLowerCase();
        const value = args.join(' ').trim();
        const column = ['setgoodbye', 'setdespedida'].includes(command) ? 'goodbye_text' : 'welcome_text';

        db.getSafeGroup(jid, (ensureErr, settings) => {
            if (ensureErr) {
                console.error('Error al registrar configuración del grupo:', ensureErr.message);
                return sock.sendMessage(jid, { text: '「✿」 No pude cargar la configuración del grupo.' }, { quoted: m });
            }

            if (['testwelcome', 'probarbienvenida', 'previewwelcome'].includes(command)) {
                const preview = (settings.welcome_text || '¡Bienvenid@ al grupo! 🌸').replace(/@user/g, '@' + (m.key.participant || jid).split('@')[0]);
                return sock.sendMessage(jid, {
                    text: `「✿」 Vista previa de bienvenida 🌸\n\n${preview}`,
                    mentions: m.key.participant ? [m.key.participant] : []
                }, { quoted: m });
            }

            if (['setwelcomeimg', 'setbienvenidaimg', 'welcomeimg', 'setwelcomegif'].includes(command)) {
                if (!/^https?:\/\/\S+$/i.test(value)) {
                    return sock.sendMessage(jid, { text: '「✿」 Envía una URL directa de imagen/GIF para establecer el banner de bienvenida.' }, { quoted: m });
                }
                return db.run(`UPDATE group_settings SET welcome_image = ? WHERE group_jid = ?`, [value, jid], (err) => {
                    if (err) {
                        console.error('Error al guardar welcome_image:', err.message);
                        return sock.sendMessage(jid, { text: '「✿」 No se pudo guardar la imagen de bienvenida.' }, { quoted: m });
                    }
                    sock.sendMessage(jid, { text: '「✿」 Imagen de bienvenida guardada. 🌸' }, { quoted: m });
                });
            }

            if (!value) {
                return sock.sendMessage(jid, { text: `「✿」 Escribe el mensaje que quieres guardar.\n_Puedes usar @user para mencionar al miembro._` }, { quoted: m });
            }

            db.run(`UPDATE group_settings SET ${column} = ? WHERE group_jid = ?`, [value, jid], (err) => {
                if (err) {
                    console.error(`Error al guardar ${column}:`, err.message);
                    return sock.sendMessage(jid, { text: '「✿」 No se pudo guardar el mensaje personalizado.' }, { quoted: m });
                }
                const label = column === 'welcome_text' ? 'bienvenida' : 'despedida';
                sock.sendMessage(jid, { text: `「✿」 Mensaje de ${label} actualizado. ✨` }, { quoted: m });
            });
        });
    }
};
