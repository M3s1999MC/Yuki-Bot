const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'setprofile_legacy',
    aliases: [],
    category: 'utility',
    description: 'Configura o elimina los campos de tu perfil personal (cumpleaños, biografía, pasatiempo, género).',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const username = sender.split('@')[0];
        const cmd = m.text?.split(' ')[0]?.replace('!', '').toLowerCase() || '';
        const query = args.join(' ');

        let column = '';
        let defaultValue = 'No configurado';
        let successText = '';

        if (cmd.includes('birth')) {
            column = 'birthday';
            successText = query ? `🎂 Cumpleaños establecido: *${query}*` : '🗑️ Cumpleaños eliminado del perfil.';
        } else if (cmd.includes('desc')) {
            column = 'bio';
            defaultValue = 'Sin descripción';
            successText = query ? `♡ Descripción actualizada: _${query}_` : '🗑️ Descripción eliminada.';
        } else if (cmd.includes('hobby') || cmd.includes('pasatiempo')) {
            column = 'hobby';
            successText = query ? `🎨 Pasatiempo establecido: *${query}*` : '🗑️ Pasatiempo eliminado.';
        } else if (cmd.includes('genre')) {
            column = 'gender';
            defaultValue = 'No especificado';
            successText = query ? `⚥ Género establecido: *${query}*` : '🗑️ Género eliminado.';
        }

        if (!column) {
            return await sock.sendMessage(jid, { text: '⚠️ Comando no reconocido.' }, { quoted: m });
        }

        const valueToSave = query ? query : defaultValue;

        // 1. Asegurar que el usuario existe en la BD
        db.run(
            `INSERT OR IGNORE INTO users (jid, name, exp, level, coins, wallet, bank) VALUES (?, ?, 0, 1, 0, 0, 0)`,
            [sender, username],
            (err) => {
                if (err) console.error('Error al asegurar usuario:', err);

                // 2. Actualizar el campo específico
                db.run(`UPDATE users SET ${column} = ? WHERE jid = ?`, [valueToSave, sender], (updateErr) => {
                    if (updateErr) {
                        console.error('Error al actualizar perfil:', updateErr);
                        return sock.sendMessage(jid, { text: '❌ Error al actualizar el perfil en la base de datos.' }, { quoted: m });
                    }
                    sock.sendMessage(jid, { text: successText }, { quoted: m });
                });
            }
        );
    }
};