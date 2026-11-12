module.exports = {
    name: 'clashmejorar',
    category: 'gacha',
    description: 'Usa un artículo en una carta para subirla de nivel.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const [num, id] = args;

        if (!num || !id) return sock.sendMessage(jid, { text: '(「✿」 "MEJORAR CARTA"🌸)\n\n⚠️ Uso: `!clashmejorar <número> <ID>`' }, { quoted: m });

        await sock.sendMessage(jid, {
            text: `(「✿」 "¡CARTA MEJORADA!"🌸)\n\n👑 La carta \`${id}\` ha subido de nivel.`
        }, { quoted: m });
    }
};
