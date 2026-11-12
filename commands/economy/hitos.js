module.exports = {
    name: 'hitos',
    aliases: ['elogros', 'metas'],
    category: 'economy',
    description: 'Muestra las insignias por llegar a ciertas cantidades de dinero.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        
        let targetUser = m.key.participant || jid;
        if (m.message.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            targetUser = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }

        const texto = `🏆 *HITOS Y LOGROS FINANCIEROS* 🏆\n\n` +
                      `👤 *Usuario:* @${targetUser.split('@')[0]}\n\n` +
                      `🥉 [✓] *Primeros Ahorros:* Alcanzar ¥10,000\n` +
                      `🥈 [✓] *Inversionista:* Alcanzar ¥100,000\n` +
                      `🥇 [ ] *Magnate de Yuki:* Alcanzar ¥1,000,000\n` +
                      `💎 [ ] *Dios del Dinero:* Alcanzar ¥10,000,000`;

        await sock.sendMessage(jid, { text: texto, mentions: [targetUser] }, { quoted: m });
    }
};
