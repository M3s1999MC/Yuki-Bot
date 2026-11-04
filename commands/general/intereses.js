module.exports = {
    name: 'intereses',
    alias: ['gustos', 'sethobby', 'setpasatiempo'],
    desc: 'Establece una lista de gustos o intereses en tu perfil',
    run: async (sock, m, args, db) => {
        const jid = m.key.participant || m.key.remoteJid;
        const texto = args.join(' ');
        if (!texto) return sock.sendMessage(m.key.remoteJid, { text: '⚠️ Escribe tus intereses. Ejemplo: `!intereses Anime, Voleibol, Programar`' }, { quoted: m });

        db.run(`UPDATE users SET hobby = ? WHERE jid = ?`, [texto, jid], async (err) => {
            if (err) return sock.sendMessage(m.key.remoteJid, { text: '❌ Error al actualizar tus intereses.' }, { quoted: m });
            await sock.sendMessage(m.key.remoteJid, { text: `🌸 ¡Intereses actualizados correctamente!\n✨ *Nuevos gustos:* ${texto}` }, { quoted: m });
        });
    }
};
