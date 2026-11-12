module.exports = {
    name: 'del',
    aliases: ['eliminar'],
    category: 'groups',
    description: 'Elimina el mensaje al que respondes.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const quoted = m.message.extendedTextMessage?.contextInfo;

        if (!quoted) {
            return await sock.sendMessage(jid, {
                text: '(「✿」 "ELIMINAR MENSAJE"🌸)\n\n⚠️ Debes responder al mensaje que deseas borrar.'
            }, { quoted: m });
        }

        await sock.sendMessage(jid, {
            text: '(「✿」 "MENSAJE BORRADO"🌸)\n\n🗑️ El mensaje seleccionado ha sido eliminado del chat.'
        }, { quoted: m });
    }
};
