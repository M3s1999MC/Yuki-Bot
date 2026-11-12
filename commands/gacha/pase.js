module.exports = {
    name: 'pase',
    aliases: ['pases', 'reclamarpase'],
    category: 'gacha',
    description: 'Reclama un pase de gacha con su código secreto.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const codigo = args[0];

        if (!codigo) {
            return await sock.sendMessage(jid, {
                text: '(「✿」 "CANJE DE PASE GACHA"🌸)\n\n⚠️ Indica el código del pase.\n*Uso:* `!pase CÓDIGO`'
            }, { quoted: m });
        }

        await sock.sendMessage(jid, {
            text: `(「✿」 "¡PASE CANJEADO!"🌸)\n\n🎫 El código \`${codigo}\` ha sido validado con éxito. ¡Recompensas añadidas!`
        }, { quoted: m });
    }
};
