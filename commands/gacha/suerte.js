module.exports = {
    name: 'suerte',
    aliases: ['luck', 'gachaluck'],
    category: 'gacha',
    description: 'Revisa tu índice de suerte actual para las tiradas.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = jid.endsWith('@g.us') ? (m.key.participant || m.key.remoteJid) : jid;
        const username = sender.split('@')[0];

        // Calcular un porcentaje de suerte aleatorio o basado en ID
        const luckPercentage = Math.floor(Math.random() * 100) + 1;
        
        let statusEmoji = '🌟 ¡Suerte divina!';
        if (luckPercentage < 30) statusEmoji = '🌧️ Suerte baja... mejor espera un poco.';
        else if (luckPercentage < 70) statusEmoji = '⛅ Suerte estable y normal.';

        const caption = `「✿」 Medidor de Suerte ◢ @${username} ◤\n\n` +
                        `🍀 Porcentaje: *${luckPercentage}%*\n` +
                        `🔮 Estado: ${statusEmoji}`;

        await sock.sendMessage(jid, { text: caption, mentions: [sender] }, { quoted: m });
    }
};