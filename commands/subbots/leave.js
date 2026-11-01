module.exports = {
    name: 'leave',
    aliases: ['salir'],
    category: 'subbot',
    description: 'Hace que el bot salga de un grupo.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        if (!jid.endsWith('@g.us')) {
            return await sock.sendMessage(jid, { text: '⚠️ Este comando solo se puede usar dentro de un grupo.' }, { quoted: m });
        }

        await sock.sendMessage(jid, { text: '👋 Saliendo del grupo...' }, { quoted: m });
        await sock.groupLeave(jid);
    }
};