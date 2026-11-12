module.exports = {
    name: 'dragondar',
    category: 'gacha',
    description: 'Alimenta a un dragón para subirlo de nivel.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const [num, id] = args;

        if (!num || !id) return sock.sendMessage(jid, { text: '(「✿」 "ALIMENTAR DRAGÓN"🌸)\n\n⚠️ Uso: `!dragondar <número> <ID>`' }, { quoted: m });

        await sock.sendMessage(jid, {
            text: `(「✿」 "¡DRAGÓN FORTALECIDO!"🌸)\n\n🐉 El dragón \`${id}\` subió de nivel.`
        }, { quoted: m });
    }
};
