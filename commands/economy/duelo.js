module.exports = {
    name: 'duelo',
    category: 'economy',
    description: 'Desafía a un usuario.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const targetUser = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const monto = parseInt(args[args.length - 1]);

        if (!targetUser || !monto) {
            return await sock.sendMessage(jid, { text: '(「✿」 "DUELO DE APUESTAS"🌸)\n\n⚠️ Menciona al rival y el monto.\n*Uso:* `!duelo @usuario <cantidad>`' }, { quoted: m });
        }

        await sock.sendMessage(jid, { text: `(「✿」 "DUELO INICIADO"🌸)\n\n⚔️ El enfrentamiento contra @${targetUser.split('@')[0]} por ¥${monto.toLocaleString()} está en curso.`, mentions: [targetUser] }, { quoted: m });
    }
};
