const db = require('../../database/db');

module.exports = {
    name: 'biblioteca',
    aliases: ['misfrases', 'library'],
    category: 'utilidades',
    description: 'Muestra tus frases guardadas o elimina una por número.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = jid.endsWith('@g.us') ? (m.key.participant || jid) : jid;
        const subcommand = (args[0] || '').toLowerCase();
        const index = Number.parseInt(args[1], 10);
        db.getSafeUser(sender, (ensureErr) => {
            if (ensureErr) {
                console.error('Error al registrar usuario para biblioteca:', ensureErr.message);
                return sock.sendMessage(jid, { text: '「✿」 No pude abrir tu biblioteca.' }, { quoted: m });
            }

            if (subcommand === 'borrar') {
                if (!Number.isInteger(index) || index < 1) {
                    return sock.sendMessage(jid, { text: '「✿」 Indica el número de la frase: !biblioteca borrar 2.' }, { quoted: m });
                }
                return db.get(`SELECT id FROM saved_phrases WHERE user_jid = ? ORDER BY id LIMIT 1 OFFSET ?`, [sender, index - 1], (findErr, row) => {
                    if (findErr || !row) {
                        if (findErr) console.error('Error al buscar frase para borrar:', findErr.message);
                        return sock.sendMessage(jid, { text: '「✿」 No encontré una frase con ese número.' }, { quoted: m });
                    }
                    db.run(`DELETE FROM saved_phrases WHERE id = ? AND user_jid = ?`, [row.id, sender], (deleteErr) => {
                        if (deleteErr) {
                            console.error('Error al borrar frase:', deleteErr.message);
                            return sock.sendMessage(jid, { text: '「✿」 No se pudo eliminar la frase.' }, { quoted: m });
                        }
                        sock.sendMessage(jid, { text: '「✿」 Frase eliminada de tu biblioteca. 🗑️' }, { quoted: m });
                    });
                });
            }

            db.all(`SELECT phrase FROM saved_phrases WHERE user_jid = ? ORDER BY id DESC LIMIT 50`, [sender], (err, rows) => {
                if (err) {
                    console.error('Error al consultar biblioteca:', err.message);
                    return sock.sendMessage(jid, { text: '「✿」 No pude consultar tu biblioteca.' }, { quoted: m });
                }
                const text = rows.length
                    ? `「✿」 Tu biblioteca 📚🌸\n\n${rows.map((row, i) => `${i + 1}. ${row.phrase}`).join('\n\n')}\n\n_Usa !biblioteca borrar <número> para eliminar una._`
                    : '「✿」 Tu biblioteca está vacía. Guarda una frase con !guardar <texto>.';
                sock.sendMessage(jid, { text }, { quoted: m });
            });
        });
    }
};
