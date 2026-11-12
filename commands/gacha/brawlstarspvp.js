module.exports = {
    name: 'brawlstarspvp',
    aliases: ['brawlpvp'],
    category: 'gacha',
    description: 'Desafía a otro usuario con tu Brawler en combate por rondas.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || jid;
        const targetUser = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const apuesta = parseInt(args[1]);
        const idBrawler = args[2];

        if (!targetUser || !apuesta || !idBrawler) {
            return await sock.sendMessage(jid, {
                text: '(「✿」 "COMBATE BRAWL STARS PVP"🌸)\n\n⚠️ Uso correcto:\n`!brawlpvp @usuario <apuesta> <ID>`'
            }, { quoted: m });
        }

        await sock.sendMessage(jid, {
            text: `(「✿」 "DUELO BRAWLER INICIADO"🌸)\n\n⚔️ El enfrentamiento contra @${targetUser.split('@')[0]} por ¥${apuesta.toLocaleString()} ha comenzado.`,
            mentions: [targetUser]
        }, { quoted: m });
    }
};
