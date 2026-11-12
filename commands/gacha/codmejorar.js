module.exports = {
    name: 'codmejorar',
    category: 'gacha',
    description: 'Usa un artículo en tu ítem de COD para subirlo de nivel.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const [num, id] = args;

        if (!num || !id) return sock.sendMessage(jid, { text: '(「✿」 "MEJORAR ARMA"🌸)\n\n⚠️ Uso: `!codmejorar <número> <ID>`' }, { quoted: m });

        await sock.sendMessage(jid, {
            text: `(「✿」 "¡ARMAMENTO MEJORADO!"🌸)\n\n🎖️ El ítem \`${id}\` subió de nivel.`
        }, { quoted: m });
    }
};
