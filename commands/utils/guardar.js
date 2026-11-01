const db = require('../../database/db');

module.exports = {
    name: 'guardar',
    aliases: ['guardarfrase'],
    category: 'utilidades',
    description: 'Guarda una frase en tu biblioteca personal.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = m.key.remoteJid.endsWith('@g.us') ? (m.key.participant || m.key.remoteJid) : m.key.remoteJid;
        const frase = args.join(' ').trim();

        if (!frase) return await sock.sendMessage(jid, { text: '「✿」 Escribe la frase que quieres guardar.' }, { quoted: m });

        db.getSafeUser(sender, (ensureErr) => {
            if (ensureErr) {
                console.error('Error al registrar usuario para guardar frase:', ensureErr.message);
                return sock.sendMessage(jid, { text: '「✿」 No pude preparar tu biblioteca.' }, { quoted: m });
            }
            db.run(`INSERT INTO saved_phrases (user_jid, phrase) VALUES (?, ?)`, [sender, frase], (err) => {
                if (err) {
                    console.error('Error al guardar frase:', err.message);
                    return sock.sendMessage(jid, { text: '「✿」 No se pudo guardar la frase.' }, { quoted: m });
                }
                sock.sendMessage(jid, { text: '「✿」 Frase guardada en tu biblioteca. 📚🌸' }, { quoted: m });
            });
        });
    }
};