module.exports = {
    name: 'setgoodbye',
    aliases: ['setbye'],
    category: 'groups',
    description: 'Edita el mensaje de despedida con broches.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const mensaje = args.join(' ');

        if (!mensaje) {
            return await sock.sendMessage(jid, {
                text: '(「✿」 "CONFIGURAR DESPEDIDA"🌸)\n\n⚠️ Escribe el mensaje usando broches.\n*Uso:* `!setgoodbye Adiós {usuario}, te extrañaremos.`'
            }, { quoted: m });
        }

        await sock.sendMessage(jid, {
            text: '(「✿」 "DESPEDIDA GUARDADA"🌸)\n\n✅ El mensaje personalizado de despedida ha sido actualizado con éxito.'
        }, { quoted: m });
    }
};
