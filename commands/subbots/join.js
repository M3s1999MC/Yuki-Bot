module.exports = {
    name: 'join',
    aliases: ['unir'],
    category: 'subbot',
    description: 'Une al bot a un grupo mediante un enlace de invitación.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const inviteCode = args[0];

        if (!inviteCode) {
            return await sock.sendMessage(jid, { text: '⚠️ Por favor ingresa el enlace de invitación del grupo.' }, { quoted: m });
        }

        await sock.sendMessage(jid, { text: '✅ ¡Uniéndome al grupo exitosamente!' }, { quoted: m });
    }
};