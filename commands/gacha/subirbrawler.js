module.exports = {
    name: 'subirbrawler',
    category: 'gacha',
    description: 'Gasta cubitos de fuerza para subir de nivel a un Brawler.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const idBrawler = args[0];

        if (!idBrawler) {
            return await sock.sendMessage(jid, {
                text: '(「✿」 "MEJORA DE BRAWLER"🌸)\n\n⚠️ Indica el ID del brawler.\n*Uso:* `!subirbrawler <ID> [cantidad]`'
            }, { quoted: m });
        }

        await sock.sendMessage(jid, {
            text: `(「✿」 "NIVEL MEJORADO"🌸)\n\n⬆️ Has gastado cubitos de fuerza para subir de nivel al brawler \`${idBrawler}\`.`
        }, { quoted: m });
    }
};
