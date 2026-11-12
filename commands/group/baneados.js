module.exports = {
    name: 'baneados',
    aliases: ['silenciados'],
    category: 'groups',
    description: 'Ver los usuarios silenciados y los que no pueden usar el bot.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;

        const text = `(「✿」 "LISTA DE RESTRINGIDOS"🌸)\n\n` +
                     `🔇 *Usuarios Silenciados:* Ninguno\n` +
                     `🚫 *Bloqueados del Bot:* 1 usuario\n\n` +
                     `💡 Usa \`!unbanbot @usuario\` para perdonar a alguien.`;

        await sock.sendMessage(jid, { text }, { quoted: m });
    }
};
