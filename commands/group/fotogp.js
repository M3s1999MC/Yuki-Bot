module.exports = {
    name: 'fotogp',
    aliases: ['photogp'],
    category: 'groups',
    description: 'Cambiar la foto del grupo.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;

        await sock.sendMessage(jid, {
            text: '(「✿」 "FOTO DE GRUPO"🌸)\n\n🖼️ Adjunta una imagen o responde a una foto con `!fotogp` para actualizar la portada.'
        }, { quoted: m });
    }
};
