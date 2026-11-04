module.exports = {
    name: 'titulo',
    alias: ['settitle', 'tituloPerfil'],
    desc: 'Establece un título personalizado en tu perfil',
    run: async (sock, m, args, db) => {
        const jid = m.key.participant || m.key.remoteJid;
        const titulo = args.join(' ');
        if (!titulo) return sock.sendMessage(m.key.remoteJid, { text: '⚠️ Escribe el título que quieres ponértelo. Ejemplo: `!titulo El Animador Legendario`' }, { quoted: m });

        db.run(`UPDATE users SET bio = ? WHERE jid = ?`, [titulo, jid], async (err) => {
            if (err) return sock.sendMessage(m.key.remoteJid, { text: '❌ Error al guardar el título.' }, { quoted: m });
            await sock.sendMessage(m.key.remoteJid, { text: `🏷️ ¡Título actualizado! Ahora eres: *${titulo}*` }, { quoted: m });
        });
    }
};
