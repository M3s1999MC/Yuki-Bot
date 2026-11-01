const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'rewards_legacy',
    aliases: [],
    category: 'economy',
    description: 'Reclama tu recompensa diaria, semanal o mensual.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const username = sender.split('@')[0];
        const cmd = m.text?.split(' ')[0]?.replace('!', '') || 'daily';

        let reward = 1000;
        let title = 'Diaria';
        if (cmd === 'weekly') { reward = 7000; title = 'Semanal'; }
        if (cmd === 'monthly') { reward = 30000; title = 'Mensual'; }

        db.run(
            `UPDATE users SET wallet = wallet + ? WHERE jid = ?`,
            [reward, sender],
            (err) => {
                if (err) return sock.sendMessage(jid, { text: '❌ Error al reclamar la recompensa.' }, { quoted: m });

                const caption = `🎁 **¡Recompensa ${title} Reclamada!** 🎁\n\n` +
                                `👤 @${username}\n` +
                                `💵 Ganancia: *+$${reward.toLocaleString('es-CO')} coins*`;

                sock.sendMessage(jid, { text: caption, mentions: [sender] }, { quoted: m });
            }
        );
    }
};