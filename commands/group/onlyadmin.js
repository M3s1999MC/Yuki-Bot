module.exports = {
    name: 'onlyadmin',
    aliases: ['soloadmin'],
    category: 'groups',
    description: 'Hacer que el bot solo responda a los administradores del grupo.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const estado = args[0]?.toLowerCase();

        if (!['on', 'off'].includes(estado)) {
            return await sock.sendMessage(jid, {
                text: '(「✿」 "MODO SOLO ADMINS"🌸)\n\n⚠️ Uso: `!onlyadmin on` o `!onlyadmin off`'
            }, { quoted: m });
        }

        await sock.sendMessage(jid, {
            text: `(「✿」 "MODO SOLO ADMINS ACTUALIZADO"🌸)\n\n🛡️ El bot ahora responde exclusivamente a administradores: *${estado.toUpperCase()}*.`
        }, { quoted: m });
    }
};
