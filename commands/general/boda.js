module.exports = {
    name: 'boda',
    alias: ['bodas', 'matrimonio'],
    desc: 'Muestra los detalles y tiempo de tu matrimonio actual',
    run: async (sock, m, args, db) => {
        const jid = m.key.participant || m.key.remoteJid;
        db.getSafeUser(jid, async (err, user) => {
            if (err || !user) return sock.sendMessage(m.key.remoteJid, { text: '❌ No se pudo consultar la información de tu boda.' }, { quoted: m });
            
            if (!user.married || user.married === 'Nadie 💔') {
                return sock.sendMessage(m.key.remoteJid, { text: '💍 Actualmente estás soltero/a. ¡Usa `!marry @usuario` para casarte!' }, { quoted: m });
            }

            await sock.sendMessage(m.key.remoteJid, { 
                text: `💍 *ESTADO CIVIL DE YUKI* 💍\n\n🌸 *Pareja:* ${user.married}\n💕 *Estado:* Felices juntos\n\n_¡Mantengan la chispa encendida!_ ✨`,
                mentions: [jid]
            }, { quoted: m });
        });
    }
};
