module.exports = {
    name: 'regalar',
    aliases: ['gift', 'regalarpersonaje'],
    category: 'gacha',
    description: 'Regala un personaje de cualquier gacha a otro usuario.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || jid;
        const categoria = args[0]?.toLowerCase();
        const id = args[1];
        const targetUser = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

        if (!categoria || !id || !targetUser || targetUser === sender) {
            return await sock.sendMessage(jid, {
                text: '(「✿」 "TRANSFERENCIA DE PERSONAJE"🌸)\n\n⚠️ Uso correcto:\n`!regalar <categoría> <ID> @usuario`'
            }, { quoted: m });
        }

        // TODO: Actualizar owner_id en Neon/Postgres
        await sock.sendMessage(jid, {
            text: `(「✿」 "¡REGALO ENVIADO!"🌸)\n\n🎁 @${sender.split('@')[0]} le ha regalado el personaje \`${id}\` (*${categoria}*) a @${targetUser.split('@')[0]}.`,
            mentions: [sender, targetUser]
        }, { quoted: m });
    }
};
