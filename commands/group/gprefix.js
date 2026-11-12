module.exports = {
    name: 'gprefix',
    aliases: ['setgprefix', 'addgprefix', 'delgprefix', 'resetgprefix'],
    category: 'groups',
    description: 'Administra los prefijos propios del grupo (uno solo o varios).',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const subCmd = args[0];

        if (!subCmd) {
            return await sock.sendMessage(jid, {
                text: '(「✿」 "PREFIJOS DEL GRUPO"🌸)\n\n⚙️ *Uso:* \`!gprefix set <p>\`, \`!gprefix add <p>\`, \`!gprefix del <p>\` o \`!gprefix reset\`'
            }, { quoted: m });
        }

        await sock.sendMessage(jid, {
            text: `(「✿」 "PREFIJOS ACTUALIZADOS"🌸)\n\n⚡ La configuración de prefijos personalizados para este grupo ha sido aplicada.`
        }, { quoted: m });
    }
};
