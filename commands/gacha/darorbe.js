module.exports = {
    name: 'darorbe',
    aliases: ['usarorbe'],
    category: 'gacha',
    description: 'Usa un orbe en uno de tus Snakes para subirlo de nivel.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const [num, id] = args;

        if (!num || !id) return sock.sendMessage(jid, { text: '(「✿」 "USAR ORBE"🌸)\n\n⚠️ Uso: `!darorbe <número> <ID>`' }, { quoted: m });

        await sock.sendMessage(jid, {
            text: `(「✿」 "¡SNAKE EVOLUCIONADO!"🌸)\n\n🐍 Aplicaste el orbe al Snake \`${id}\` y subió de nivel.`
        }, { quoted: m });
    }
};
