module.exports = {
    name: 'ascender',
    aliases: ['ascension', 'estrella'],
    category: 'gacha',
    description: 'Asciende un personaje en nivel máximo para extender su nivel.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const categoria = args[0]?.toLowerCase();
        const id = args[1];

        if (!categoria || !id) {
            return await sock.sendMessage(jid, {
                text: '(「✿」 "ASCENSIÓN DE PERSONAJE"🌸)\n\n⚠️ Indica la categoría y el ID del personaje.\n*Uso:* `!ascender <categoría> <ID>`'
            }, { quoted: m });
        }

        // TODO: Validar en Neon/Postgres que el personaje esté en nivel máximo y descontar materiales/monedas
        await sock.sendMessage(jid, {
            text: `(「✿」 "¡ASCENSIÓN COMPLETADA!"🌸)\n\n⭐ El personaje \`${id}\` de la categoría *${categoria}* ha obtenido una nueva estrella y su límite de nivel ha aumentado.`
        }, { quoted: m });
    }
};
