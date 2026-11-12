module.exports = {
    name: 'regalartodo',
    aliases: ['regalarharem', 'regalarcoleccion'],
    category: 'gacha',
    description: 'Regala toda tu colección de una categoría a otro usuario.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || jid;
        const categoria = args[0]?.toLowerCase();
        const targetUser = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

        if (!categoria || !targetUser || targetUser === sender) {
            return await sock.sendMessage(jid, {
                text: '(「✿」 "TRANSFERENCIA TOTAL"🌸)\n\n⚠️ Uso correcto:\n`!regalartodo <categoría> @usuario`'
            }, { quoted: m });
        }

        // TODO: Actualizar todos los registros de esa categoría en Neon/Postgres
        await sock.sendMessage(jid, {
            text: `(「✿」 "¡COLECCIÓN TRANSFERIDA!"🌸)\n\n📦 @${sender.split('@')[0]} ha transferido todos sus personajes de *${categoria}* a @${targetUser.split('@')[0]}.`,
            mentions: [sender, targetUser]
        }, { quoted: m });
    }
};
