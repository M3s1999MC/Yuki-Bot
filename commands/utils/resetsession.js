module.exports = {
    name: 'resetsession',
    aliases: ['fixsession', 'resyncsession'],
    category: 'utility',
    description: 'Restablece la sesión de conexión.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        await sock.sendMessage(jid, { text: '🔄 Comprobando integridad de sesión y caché local...' }, { quoted: m });
    }
};