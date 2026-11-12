module.exports = {
    name: 'close',
    aliases: ['cerrar'],
    category: 'groups',
    description: 'Cierra el grupo para que solo escriban los administradores.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        await sock.sendMessage(jid, { text: '(「✿」 "ESTADO DEL GRUPO"🌸)\n\n🔒 El grupo ha sido cerrado. Ahora solo los administradores pueden escribir.' });
    }
};
