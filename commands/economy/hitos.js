module.exports = {
    name: 'hitos',
    aliases: ['elogros', 'metas'],
    category: 'economy',
    description: 'Insignias por llegar a ciertas cantidades de dinero.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const targetUser = m.key.participant || jid;

        const text = `(「✿」 "HITOS FINANCIEROS"🌸)\n\n` +
                     `👤 @${targetUser.split('@')[0]}\n\n` +
                     `🥉 [✓] Primeros Ahorros (¥10k)\n` +
                     `🥈 [✓] Inversionista (¥100k)\n` +
                     `🥇 [ ] Magnate de Yuki (¥1M)`;

        await sock.sendMessage(jid, { text, mentions: [targetUser] }, { quoted: m });
    }
};
