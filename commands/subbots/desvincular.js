module.exports = {
    name: 'desvincular',
    aliases: ['unlink', 'delsub'],
    category: 'subbot',
    description: 'Desvincula tu sub-bot y borra su sesión.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        await sock.sendMessage(jid, { text: '🗑️ Sesión de sub-bot eliminada y desvinculada correctamente.' }, { quoted: m });
    }
};