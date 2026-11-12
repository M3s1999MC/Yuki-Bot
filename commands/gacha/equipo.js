module.exports = {
    name: 'equipo',
    aliases: ['team', 'miequipo'],
    category: 'gacha',
    description: 'Arma o muestra tu equipo de batalla por categoría.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || jid;
        const categoria = args[0]?.toLowerCase();
        const ids = args.slice(1);

        if (!categoria) {
            return await sock.sendMessage(jid, {
                text: '(「✿」 "GESTIÓN DE EQUIPO"🌸)\n\n⚠️ Especifica la categoría.\n*Uso:* `!equipo <categoría> [ID1 ID2 ID3]`'
            }, { quoted: m });
        }

        if (ids.length === 0) {
            // Mostrar equipo actual
            const text = `(「✿」 "EQUIPO ACTUAL - ${categoria.toUpperCase()}"🌸)\n\n` +
                         `👤 *Entrenador:* @${sender.split('@')[0]}\n` +
                         `1️⃣ \`[ID-001]\` Slot 1\n` +
                         `2️⃣ \`[ID-002]\` Slot 2\n` +
                         `3️⃣ \`[ID-003]\` Slot 3`;
            return await sock.sendMessage(jid, { text, mentions: [sender] }, { quoted: m });
        }

        // TODO: Guardar el nuevo equipo en Neon/Postgres
        await sock.sendMessage(jid, {
            text: `(「✿」 "EQUIPO ACTUALIZADO"🌸)\n\n⚔️ Tu escuadrón de *${categoria}* ha sido configurado con los IDs: \`${ids.join(', ')}\`.`
        }, { quoted: m });
    }
};
